import { createClient } from "@/lib/supabase/server";

export interface Match {
  id: string;
  nome: string;
  score: number;
  pontosObtidos: number;
  pontosPossiveis: number;
  detalhesScore: DetalheScore[];

  bairro: string | null;
  cidade: string | null;
  tipo: string | null;
  finalidade: string | null;
  valor: number | null;

  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  suites: number | null;

  foto: string | null;
  descricao: string | null;

  quintoandar: string | null;
  orulo: string | null;

  endereco: string | null;
  numero: string | null;
  codigo: string | null;

  destaque: boolean | null;
}

export type StatusDetalheScore =
  | "atende"
  | "parcial"
  | "nao_atende"
  | "desconhecido";

export interface DetalheScore {
  criterio: string;
  label: string;
  status: StatusDetalheScore;
  pontos: number;
  pontosPossiveis: number;
  descricao: string;
}

interface Cliente {
  id: string;
  interesse: string | null;
  finalidade: string | null;
  bairro: string | null;
  cidade: string | null;
  valor_min: number | null;
  valor: number | null;
  quartos_min: number | null;
  suites_min: number | null;
  banheiros_min: number | null;
  vagas_min: number | null;
  area_min: number | null;
}

interface Imovel {
  id: string;
  titulo: string;
  bairro: string | null;
  cidade: string | null;
  tipo: string | null;
  finalidade: string | null;
  valor: number | null;

  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  suites: number | null;

  foto: string | null;
  descricao: string | null;

  quintoandar: string | null;
  orulo: string | null;

  endereco: string | null;
  numero: string | null;
  codigo: string | null;

  destaque: boolean | null;

  status: string | null;
}

function normalizar(
  texto: string | null | undefined
): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function preferenciaValida(
  valor: number | null
): valor is number {
  return valor !== null && valor > 0;
}

function pontuarMinimo(
  preferencia: number,
  valorImovel: number | null,
  peso: number
) {
  if (valorImovel === null || valorImovel <= 0) {
    return Math.ceil(peso / 2);
  }

  if (valorImovel >= preferencia) {
    return peso;
  }

  if (valorImovel >= preferencia * 0.8) {
    return Math.ceil(peso / 2);
  }

  return 0;
}

function statusPorPontos(
  pontos: number,
  pontosPossiveis: number,
  desconhecido = false
): StatusDetalheScore {
  if (desconhecido) {
    return "desconhecido";
  }

  if (pontos === pontosPossiveis) {
    return "atende";
  }

  if (pontos > 0) {
    return "parcial";
  }

  return "nao_atende";
}

function pontuarPreco(
  cliente: Cliente,
  imovel: Imovel
) {
  const valorMinimo = preferenciaValida(cliente.valor_min)
    ? cliente.valor_min
    : null;
  const valorMaximo = preferenciaValida(cliente.valor)
    ? cliente.valor
    : null;

  if (!valorMinimo && !valorMaximo) {
    return 0;
  }

  if (imovel.valor === null || imovel.valor <= 0) {
    return 10;
  }

  if (valorMaximo) {
    if (
      (!valorMinimo || imovel.valor >= valorMinimo) &&
      imovel.valor <= valorMaximo
    ) {
      return 20;
    }

    if (valorMinimo && imovel.valor < valorMinimo) {
      return imovel.valor >= valorMinimo * 0.8 ? 10 : 5;
    }

    if (imovel.valor <= valorMaximo * 1.10) {
      return 14;
    }

    if (imovel.valor <= valorMaximo * 1.20) {
      return 7;
    }

    return 0;
  }

  if (valorMinimo && imovel.valor >= valorMinimo) {
    return 20;
  }

  if (valorMinimo && imovel.valor >= valorMinimo * 0.8) {
    return 10;
  }

  return 5;
}

function descreverPreco(
  cliente: Cliente,
  imovel: Imovel,
  pontos: number
) {
  const valorMinimo = preferenciaValida(cliente.valor_min)
    ? cliente.valor_min
    : null;
  const valorMaximo = preferenciaValida(cliente.valor)
    ? cliente.valor
    : null;

  if (imovel.valor === null || imovel.valor <= 0) {
    return "Valor do imóvel não informado";
  }

  if (pontos === 20) {
    return valorMinimo
      ? "Dentro da faixa de preço desejada"
      : "Dentro do valor máximo desejado";
  }

  if (valorMinimo && imovel.valor < valorMinimo) {
    return "Abaixo do valor mínimo desejado";
  }

  if (valorMaximo && imovel.valor > valorMaximo) {
    return "Acima do valor máximo desejado";
  }

  return "Preço parcialmente compatível";
}

function calcularScore(
  cliente: Cliente,
  imovel: Imovel
): {
  score: number;
  pontosObtidos: number;
  pontosPossiveis: number;
  detalhesScore: DetalheScore[];
} {
  let pontosObtidos = 0;
  let pontosPossiveis = 0;
  const detalhesScore: DetalheScore[] = [];

  function adicionarDetalhe(detalhe: DetalheScore) {
    pontosObtidos += detalhe.pontos;
    pontosPossiveis += detalhe.pontosPossiveis;
    detalhesScore.push(detalhe);
  }

  // =========================================================
  // BAIRRO — 20 pontos
  // =========================================================

  if (cliente.bairro) {
    const atende =
      imovel.bairro &&
      normalizar(cliente.bairro) ===
        normalizar(imovel.bairro);

    adicionarDetalhe({
      criterio: "bairro",
      label: "Bairro",
      status: atende ? "atende" : "nao_atende",
      pontos: atende ? 20 : 0,
      pontosPossiveis: 20,
      descricao: atende
        ? `${imovel.bairro} corresponde ao bairro desejado`
        : imovel.bairro
          ? `${imovel.bairro} não corresponde ao bairro desejado`
          : "Bairro do imóvel não informado",
    });
  }

  // =========================================================
  // CIDADE — 10 pontos
  // =========================================================

  if (cliente.cidade) {
    const atende =
      imovel.cidade &&
      normalizar(cliente.cidade) ===
        normalizar(imovel.cidade);

    adicionarDetalhe({
      criterio: "cidade",
      label: "Cidade",
      status: atende ? "atende" : "nao_atende",
      pontos: atende ? 10 : 0,
      pontosPossiveis: 10,
      descricao: atende
        ? `${imovel.cidade} corresponde à cidade desejada`
        : imovel.cidade
          ? `${imovel.cidade} não corresponde à cidade desejada`
          : "Cidade do imóvel não informada",
    });
  }

  // =========================================================
  // PREÇO / FAIXA — 20 pontos
  // =========================================================

  if (
    preferenciaValida(cliente.valor_min) ||
    preferenciaValida(cliente.valor)
  ) {
    const pontos = pontuarPreco(cliente, imovel);

    adicionarDetalhe({
      criterio: "preco",
      label: "Preço",
      status: statusPorPontos(
        pontos,
        20,
        imovel.valor === null || imovel.valor <= 0
      ),
      pontos,
      pontosPossiveis: 20,
      descricao: descreverPreco(cliente, imovel, pontos),
    });
  }

  // =========================================================
  // TIPO / INTERESSE — 15 pontos
  // =========================================================

  const interesse = normalizar(
    cliente.interesse
  );

  const tipo = normalizar(
    imovel.tipo
  );

  if (interesse) {
    const atende =
      tipo &&
      (
        tipo.includes(interesse) ||
        interesse.includes(tipo)
      );

    adicionarDetalhe({
      criterio: "tipo",
      label: "Tipo",
      status: atende ? "atende" : "nao_atende",
      pontos: atende ? 15 : 0,
      pontosPossiveis: 15,
      descricao: atende
        ? "Tipo de imóvel compatível com o interesse"
        : imovel.tipo
          ? "Tipo de imóvel não corresponde ao interesse"
          : "Tipo do imóvel não informado",
    });
  }

  // =========================================================
  // STATUS — 5 pontos
  // =========================================================

  const status = normalizar(
    imovel.status
  );

  adicionarDetalhe({
    criterio: "status",
    label: "Status",
    status: status === "disponivel" ? "atende" : "nao_atende",
    pontos: status === "disponivel" ? 5 : 0,
    pontosPossiveis: 5,
    descricao:
      status === "disponivel"
        ? "Imóvel disponível"
        : "Imóvel não está marcado como disponível",
  });

  // =========================================================
  // PREFERÊNCIAS FÍSICAS — 30 pontos
  // =========================================================

  if (preferenciaValida(cliente.quartos_min)) {
    const pontos = pontuarMinimo(cliente.quartos_min, imovel.quartos, 10);

    adicionarDetalhe({
      criterio: "quartos",
      label: "Quartos",
      status: statusPorPontos(pontos, 10, imovel.quartos === null),
      pontos,
      pontosPossiveis: 10,
      descricao:
        imovel.quartos === null
          ? "Quartos não informados no imóvel"
          : imovel.quartos >= cliente.quartos_min
            ? `${imovel.quartos} quartos ou mais`
            : `${imovel.quartos} quartos, abaixo do mínimo desejado`,
    });
  }

  if (preferenciaValida(cliente.suites_min)) {
    const pontos = pontuarMinimo(cliente.suites_min, imovel.suites, 5);

    adicionarDetalhe({
      criterio: "suites",
      label: "Suítes",
      status: statusPorPontos(pontos, 5, imovel.suites === null),
      pontos,
      pontosPossiveis: 5,
      descricao:
        imovel.suites === null
          ? "Suítes não informadas no imóvel"
          : imovel.suites >= cliente.suites_min
            ? `${imovel.suites} suítes ou mais`
            : `${imovel.suites} suítes, abaixo do mínimo desejado`,
    });
  }

  if (preferenciaValida(cliente.banheiros_min)) {
    const pontos = pontuarMinimo(
      cliente.banheiros_min,
      imovel.banheiros,
      5
    );

    adicionarDetalhe({
      criterio: "banheiros",
      label: "Banheiros",
      status: statusPorPontos(pontos, 5, imovel.banheiros === null),
      pontos,
      pontosPossiveis: 5,
      descricao:
        imovel.banheiros === null
          ? "Banheiros não informados no imóvel"
          : imovel.banheiros >= cliente.banheiros_min
            ? `${imovel.banheiros} banheiros ou mais`
            : `${imovel.banheiros} banheiros, abaixo do mínimo desejado`,
    });
  }

  if (preferenciaValida(cliente.vagas_min)) {
    const pontos = pontuarMinimo(cliente.vagas_min, imovel.vagas, 5);

    adicionarDetalhe({
      criterio: "vagas",
      label: "Vagas",
      status: statusPorPontos(pontos, 5, imovel.vagas === null),
      pontos,
      pontosPossiveis: 5,
      descricao:
        imovel.vagas === null
          ? "Vagas não informadas no imóvel"
          : imovel.vagas >= cliente.vagas_min
            ? `${imovel.vagas} vagas ou mais`
            : `${imovel.vagas} vagas, abaixo do mínimo desejado`,
    });
  }

  if (preferenciaValida(cliente.area_min)) {
    const pontos = pontuarMinimo(cliente.area_min, imovel.area, 5);

    adicionarDetalhe({
      criterio: "area",
      label: "Área",
      status: statusPorPontos(pontos, 5, imovel.area === null),
      pontos,
      pontosPossiveis: 5,
      descricao:
        imovel.area === null
          ? "Área não informada no imóvel"
          : imovel.area >= cliente.area_min
            ? `${imovel.area} m² ou mais`
            : `${imovel.area} m², abaixo do mínimo desejado`,
    });
  }

  if (pontosPossiveis === 0) {
    return {
      score: 0,
      pontosObtidos,
      pontosPossiveis,
      detalhesScore,
    };
  }

  const score = Math.max(
    0,
    Math.min(
      Math.round((pontosObtidos / pontosPossiveis) * 100),
      100
    )
  );

  return {
    score,
    pontosObtidos,
    pontosPossiveis,
    detalhesScore,
  };
}

export async function buscarMatches(
  clienteId: string,
  accessToken?: string
): Promise<Match[]> {

  console.log(
    "Buscando matches reais para:",
    clienteId
  );

  // =========================================================
  // CLIENTE SUPABASE SERVER
  // =========================================================

  const supabase = await createClient(accessToken);

  // =========================================================
  // 1. USUÁRIO LOGADO
  // =========================================================

  const {
    data: { user },
    error: authError,
  } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();

  if (authError || !user) {
    console.error(
      "Usuário não autenticado:",
      authError
    );

    throw new Error(
      authError?.message ||
      "Usuário não autenticado"
    );
  }

  console.log(
    "Usuário autenticado:",
    user.id,
    user.email
  );

  // =========================================================
  // 2. BUSCAR CLIENTE
  // =========================================================

  const {
    data: cliente,
    error: clienteError,
  } = await supabase
    .from("clientes")
    .select(`
      id,
      interesse,
      finalidade,
      bairro,
      cidade,
      valor_min,
      quartos_min,
      suites_min,
      banheiros_min,
      vagas_min,
      area_min,
      valor
    `)
    .eq("id", clienteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (clienteError) {
    console.error(
      "Erro ao buscar cliente:",
      clienteError
    );

    throw clienteError;
  }

  if (!cliente) {
    throw new Error(
      "Cliente não encontrado ou não pertence ao usuário logado."
    );
  }

  console.log(
    "Cliente encontrado:",
    cliente
  );

  // =========================================================
  // 3. BUSCAR IMÓVEIS DISPONÍVEIS
  // =========================================================

  let consultaImoveis = supabase
    .from("imoveis")
    .select(`
      id,
      titulo,
      bairro,
      cidade,
      tipo,
      finalidade,
      valor,
      quartos,
      banheiros,
      vagas,
      area,
      suites,
      foto,
      descricao,
      quintoandar,
      orulo,
      endereco,
      numero,
      codigo,
      destaque,
      status
    `)
    .eq(
      "status",
      "disponivel"
    );

  // =========================================================
  // 4. FILTRO DE FINALIDADE
  // =========================================================

  const finalidadeCliente =
    normalizar(
      cliente.finalidade
    );

  if (
    finalidadeCliente === "venda" ||
    finalidadeCliente === "locacao"
  ) {
    consultaImoveis =
      consultaImoveis.eq(
        "finalidade",
        finalidadeCliente
      );
  }

  const {
    data: imoveis,
    error: imoveisError,
  } = await consultaImoveis;

  if (imoveisError) {
    console.error(
      "Erro ao buscar imóveis:",
      imoveisError
    );

    throw imoveisError;
  }

  if (
    !imoveis ||
    imoveis.length === 0
  ) {
    console.log(
      "Nenhum imóvel disponível encontrado."
    );

    return [];
  }

  console.log(
    "Imóveis encontrados:",
    imoveis.length
  );

  // =========================================================
  // 5. CALCULAR MATCH
  // =========================================================

  const matches: Match[] =
    imoveis
      .map((imovel) => {
        const resultadoScore = calcularScore(
          cliente,
          imovel
        );

        return {
          id: imovel.id,

          nome: imovel.titulo,

          score: resultadoScore.score,
          pontosObtidos: resultadoScore.pontosObtidos,
          pontosPossiveis: resultadoScore.pontosPossiveis,
          detalhesScore: resultadoScore.detalhesScore,

          bairro: imovel.bairro,
          cidade: imovel.cidade,
          tipo: imovel.tipo,
          finalidade: imovel.finalidade,
          valor: imovel.valor,

          quartos: imovel.quartos,
          banheiros: imovel.banheiros,
          vagas: imovel.vagas,
          area: imovel.area,
          suites: imovel.suites,

          foto: imovel.foto,
          descricao: imovel.descricao,

          quintoandar:
            imovel.quintoandar,

          orulo:
            imovel.orulo,

          endereco:
            imovel.endereco,

          numero:
            imovel.numero,

          codigo:
            imovel.codigo,

          destaque:
            imovel.destaque,
        };
      })
      .filter(
        (match) =>
          match.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  console.log(
    "Matches encontrados:",
    matches
  );

  // =========================================================
  // 6. LIMPAR MATCHES ANTERIORES
  // =========================================================

  const {
    error: deleteError,
  } = await supabase
    .from("cliente_matches")
    .delete()
    .eq(
      "cliente_id",
      clienteId
    );

  if (deleteError) {
    console.error(
      "Erro ao limpar matches antigos:",
      deleteError
    );

    throw deleteError;
  }

  // =========================================================
  // 7. SALVAR NOVOS MATCHES
  // =========================================================

  if (matches.length > 0) {

    const registros =
      matches.map(
        (match) => ({
          cliente_id:
            clienteId,

          imovel_id:
            match.id,

          score:
            match.score,
        })
      );

    const {
      error: matchError,
    } = await supabase
      .from("cliente_matches")
      .insert(
        registros
      );

    if (matchError) {
      console.error(
        "Erro ao salvar matches:",
        matchError
      );

      throw matchError;
    }

    console.log(
      "Matches salvos com sucesso."
    );
  }

  // =========================================================
  // 8. RETORNAR
  // =========================================================

  return matches;
}
