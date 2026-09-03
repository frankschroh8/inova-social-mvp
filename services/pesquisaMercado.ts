import { fonteInterna } from "@/services/fontes-mercado/interna";
import type {
  FiltrosPesquisaMercado,
  ImovelPesquisaMercado,
} from "@/services/fontes-mercado/types";

export type {
  FiltrosPesquisaMercado,
  FonteMercado,
  ImovelMercadoNormalizado,
  ImovelPesquisaMercado,
} from "@/services/fontes-mercado/types";

export const fontesMercadoDisponiveis = [fonteInterna];

export interface ResumoMercado {
  quantidade: number;
  menorPreco: number | null;
  maiorPreco: number | null;
  precoMedio: number | null;
  precoMedioM2: number | null;
  menorPrecoM2: number | null;
  maiorPrecoM2: number | null;
}

export interface AvaliacaoMercado {
  imovel: ImovelPesquisaMercado;
  comparaveis: ImovelPesquisaMercado[];
  resumo: ResumoMercado;
  estimativa: number | null;
  faixaMinima: number | null;
  faixaMaxima: number | null;
  qualidade: "Amostra forte" | "Amostra moderada" | "Amostra limitada";
  amostraAmpliada: boolean;
  observacao: string;
}

export function areaReferencia(imovel: ImovelPesquisaMercado) {
  return (
    imovel.area ||
    imovel.metragem ||
    imovel.area_util ||
    imovel.area_total ||
    null
  );
}

export function valorPorM2(imovel: ImovelPesquisaMercado) {
  const area = areaReferencia(imovel);

  if (!imovel.valor || !area || area <= 0) {
    return null;
  }

  return imovel.valor / area;
}

function textoNormalizado(valor: string | null) {
  return (valor || "").toLowerCase().trim();
}

function mesmoValor(a: string | null, b: string | null) {
  return Boolean(a && b && textoNormalizado(a) === textoNormalizado(b));
}

function diferencaNumerica(a: number | null, b: number | null) {
  if (a === null || b === null) return 0;

  return Math.abs(a - b);
}

function pontuarSemelhanca(
  alvo: ImovelPesquisaMercado,
  comparavel: ImovelPesquisaMercado
) {
  const areaAlvo = areaReferencia(alvo);
  const areaComparavel = areaReferencia(comparavel);
  let pontos = 0;

  if (mesmoValor(alvo.bairro, comparavel.bairro)) pontos += 40;
  if (mesmoValor(alvo.cidade, comparavel.cidade)) pontos += 25;
  if (mesmoValor(alvo.finalidade, comparavel.finalidade)) pontos += 15;
  if (mesmoValor(alvo.tipo, comparavel.tipo)) pontos += 15;

  if (areaAlvo && areaComparavel) {
    const diferenca = Math.abs(areaAlvo - areaComparavel) / areaAlvo;

    if (diferenca <= 0.1) pontos += 10;
    else if (diferenca <= 0.2) pontos += 6;
    else if (diferenca <= 0.35) pontos += 3;
  }

  if (diferencaNumerica(alvo.quartos, comparavel.quartos) <= 1) pontos += 3;
  if (diferencaNumerica(alvo.suites, comparavel.suites) <= 1) pontos += 2;
  if (diferencaNumerica(alvo.vagas, comparavel.vagas) <= 1) pontos += 2;

  return pontos;
}

function escolherComparaveis(
  imovel: ImovelPesquisaMercado,
  todosImoveis: ImovelPesquisaMercado[]
) {
  const candidatos = todosImoveis.filter((item) => item.id !== imovel.id);
  const mesmoBairro = candidatos.filter(
    (item) =>
      mesmoValor(item.finalidade, imovel.finalidade) &&
      mesmoValor(item.tipo, imovel.tipo) &&
      mesmoValor(item.cidade, imovel.cidade) &&
      mesmoValor(item.bairro, imovel.bairro)
  );
  const mesmaCidade = candidatos.filter(
    (item) =>
      mesmoValor(item.finalidade, imovel.finalidade) &&
      mesmoValor(item.tipo, imovel.tipo) &&
      mesmoValor(item.cidade, imovel.cidade)
  );
  const cidadeAmpliada = candidatos.filter((item) =>
    mesmoValor(item.cidade, imovel.cidade)
  );

  let base = mesmoBairro;
  let amostraAmpliada = false;
  let observacao = "Amostra baseada em imóveis do mesmo bairro.";

  if (base.length < 3 && mesmaCidade.length > base.length) {
    base = mesmaCidade;
    amostraAmpliada = true;
    observacao =
      "Amostra ampliada para imóveis da mesma cidade, tipo e finalidade.";
  }

  if (base.length === 0 && cidadeAmpliada.length > 0) {
    base = cidadeAmpliada;
    amostraAmpliada = true;
    observacao = "Amostra ampliada para imóveis da mesma cidade.";
  }

  if (base.length === 0) {
    base = candidatos;
    amostraAmpliada = true;
    observacao = "Amostra ampliada para imóveis disponíveis na base interna.";
  }

  return {
    comparaveis: base
      .sort(
        (a, b) =>
          pontuarSemelhanca(imovel, b) - pontuarSemelhanca(imovel, a)
      )
      .slice(0, 8),
    amostraAmpliada,
    observacao,
  };
}

function qualidadeAmostra(
  imovel: ImovelPesquisaMercado,
  comparaveis: ImovelPesquisaMercado[]
): AvaliacaoMercado["qualidade"] {
  const comparaveisComM2 = comparaveis.filter(
    (comparavel) => valorPorM2(comparavel) !== null
  ).length;
  const mesmoBairro = comparaveis.filter((comparavel) =>
    mesmoValor(comparavel.bairro, imovel.bairro)
  ).length;

  if (comparaveis.length >= 5 && mesmoBairro >= 3 && comparaveisComM2 >= 4) {
    return "Amostra forte";
  }

  if (comparaveis.length >= 3 && comparaveisComM2 >= 2) {
    return "Amostra moderada";
  }

  return "Amostra limitada";
}

export async function buscarImoveisPesquisaMercado(
  filtros: FiltrosPesquisaMercado
) {
  return fonteInterna.buscar(filtros);
}

export function calcularResumoMercado(
  imoveis: ImovelPesquisaMercado[]
): ResumoMercado {
  const valores = imoveis
    .map((imovel) => imovel.valor)
    .filter(
      (valor): valor is number =>
        valor !== null && valor !== undefined && valor > 0
    );

  const valoresM2 = imoveis
    .map(valorPorM2)
    .filter(
      (valor): valor is number =>
        valor !== null && valor !== undefined && valor > 0
    );

  const soma = valores.reduce((total, valor) => total + valor, 0);
  const somaM2 = valoresM2.reduce((total, valor) => total + valor, 0);

  return {
    quantidade: imoveis.length,
    menorPreco: valores.length ? Math.min(...valores) : null,
    maiorPreco: valores.length ? Math.max(...valores) : null,
    precoMedio: valores.length ? soma / valores.length : null,
    precoMedioM2: valoresM2.length ? somaM2 / valoresM2.length : null,
    menorPrecoM2: valoresM2.length ? Math.min(...valoresM2) : null,
    maiorPrecoM2: valoresM2.length ? Math.max(...valoresM2) : null,
  };
}

export async function listarImoveisPesquisaMercado() {
  return buscarImoveisPesquisaMercado({
    finalidade: "",
    tipo: "",
    cidade: "",
    bairro: "",
    valorMin: "",
    valorMax: "",
    quartosMin: "",
    suitesMin: "",
    banheirosMin: "",
    vagasMin: "",
    areaMin: "",
  });
}

export async function avaliarImovelMercado(
  imovelId: string
): Promise<AvaliacaoMercado> {
  const imoveis = await listarImoveisPesquisaMercado();
  const imovel = imoveis.find((item) => item.id === imovelId);

  if (!imovel) {
    throw new Error("Imovel nao encontrado.");
  }

  const { comparaveis, amostraAmpliada, observacao } = escolherComparaveis(
    imovel,
    imoveis
  );
  const resumo = calcularResumoMercado(comparaveis);
  const area = areaReferencia(imovel);
  const podeEstimar = area !== null && area > 0 && resumo.precoMedioM2 !== null;
  const estimativa = podeEstimar ? area * resumo.precoMedioM2! : null;
  const faixaMinima =
    area !== null && area > 0 && resumo.menorPrecoM2 !== null
      ? area * resumo.menorPrecoM2
      : null;
  const faixaMaxima =
    area !== null && area > 0 && resumo.maiorPrecoM2 !== null
      ? area * resumo.maiorPrecoM2
      : null;

  return {
    imovel,
    comparaveis,
    resumo,
    estimativa,
    faixaMinima,
    faixaMaxima,
    qualidade: qualidadeAmostra(imovel, comparaveis),
    amostraAmpliada,
    observacao,
  };
}
