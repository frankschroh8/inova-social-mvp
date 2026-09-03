import { supabase } from "@/lib/supabase";
import type {
  FiltrosPesquisaMercado,
  FonteMercado,
  ImovelPesquisaMercado,
} from "@/services/fontes-mercado/types";

function numeroOuNull(valor: string) {
  const numero = Number(valor);

  return valor && !Number.isNaN(numero) ? numero : null;
}

function areaReferenciaInterna(imovel: ImovelPesquisaMercado) {
  return (
    imovel.area ||
    imovel.metragem ||
    imovel.area_util ||
    imovel.area_total ||
    null
  );
}

function atendeMinimo(valorImovel: number | null, minimo: number | null) {
  if (minimo === null) return true;

  return valorImovel !== null && valorImovel >= minimo;
}

function filtrarPorMinimos(
  imoveis: ImovelPesquisaMercado[],
  filtros: FiltrosPesquisaMercado
) {
  const quartosMin = numeroOuNull(filtros.quartosMin);
  const suitesMin = numeroOuNull(filtros.suitesMin);
  const banheirosMin = numeroOuNull(filtros.banheirosMin);
  const vagasMin = numeroOuNull(filtros.vagasMin);
  const areaMin = numeroOuNull(filtros.areaMin);

  return imoveis.filter((imovel) => {
    const area = areaReferenciaInterna(imovel);

    return (
      atendeMinimo(imovel.quartos, quartosMin) &&
      atendeMinimo(imovel.suites, suitesMin) &&
      atendeMinimo(imovel.banheiros, banheirosMin) &&
      atendeMinimo(imovel.vagas, vagasMin) &&
      atendeMinimo(area, areaMin)
    );
  });
}

async function buscarImoveisInternos(filtros: FiltrosPesquisaMercado) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado.");
  }

  let consulta = supabase
    .from("imoveis")
    .select(`
      id,
      titulo,
      codigo,
      tipo,
      finalidade,
      valor,
      condominio,
      iptu,
      bairro,
      cidade,
      estado,
      endereco,
      numero,
      quartos,
      suites,
      banheiros,
      vagas,
      area,
      area_util,
      area_total,
      metragem,
      foto,
      quintoandar,
      orulo,
      destaque
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filtros.finalidade) {
    consulta = consulta.eq("finalidade", filtros.finalidade);
  }

  if (filtros.tipo) {
    consulta = consulta.eq("tipo", filtros.tipo);
  }

  if (filtros.cidade.trim()) {
    consulta = consulta.ilike("cidade", `%${filtros.cidade.trim()}%`);
  }

  if (filtros.bairro.trim()) {
    consulta = consulta.ilike("bairro", `%${filtros.bairro.trim()}%`);
  }

  const valorMin = numeroOuNull(filtros.valorMin);
  const valorMax = numeroOuNull(filtros.valorMax);

  if (valorMin !== null) {
    consulta = consulta.gte("valor", valorMin);
  }

  if (valorMax !== null) {
    consulta = consulta.lte("valor", valorMax);
  }

  const { data, error } = await consulta;

  if (error) {
    throw error;
  }

  return filtrarPorMinimos(data || [], filtros);
}

export const fonteInterna: FonteMercado = {
  id: "crm",
  nome: "Base interna",
  origem: "interna",
  configurada: true,
  buscar: buscarImoveisInternos,
};
