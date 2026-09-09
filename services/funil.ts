import { supabase } from "@/lib/supabase";

export type EtapaFunil =
  | "Novo"
  | "Em atendimento"
  | "Interessado"
  | "Visita agendada"
  | "Proposta"
  | "Fechado";

interface ClienteFunil {
  id: string;
  nome: string;
  telefone: string | null;
  interesse: string | null;
  finalidade: string | null;
  bairro: string | null;
  cidade: string | null;
  valor: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface HistoricoFunil {
  cliente_id: string | null;
  tipo: string | null;
  descricao: string | null;
  created_at: string;
}

interface AgendaFunil {
  cliente_id: string | null;
  titulo: string | null;
  descricao: string | null;
  data_inicio: string | null;
  created_at: string | null;
  status: string | null;
}

interface PropostaFunil {
  cliente_id: string | null;
  status: string | null;
}

interface NegocioFunil {
  id: string;
  cliente_id: string | null;
  imovel_id: string | null;
  proposta_id: string | null;
  valor_final: number | string | null;
  finalidade: string | null;
  data_fechamento: string | null;
  imoveis?:
    | {
        titulo: string | null;
        codigo: string | null;
      }
    | {
        titulo: string | null;
        codigo: string | null;
      }[]
    | null;
}

function extrairEstagio(descricao: string | null) {
  if (!descricao) return null;

  const encontrado = descricao.match(
    /Estágio: (interessado|visita_agendada|proposta|sem_interesse)/i
  );

  return encontrado?.[1]?.toLowerCase() || null;
}

function normalizarTexto(texto: string | null | undefined) {
  return (texto || "").toLowerCase().trim();
}

function dataMaisRecente(datas: (string | null | undefined)[]) {
  return (
    datas
      .filter(Boolean)
      .sort(
        (a, b) =>
          new Date(b as string).getTime() -
          new Date(a as string).getTime()
      )[0] || null
  );
}

function primeiroRelacionamento<T>(valor: T | T[] | null | undefined) {
  if (Array.isArray(valor)) {
    return valor[0] || null;
  }

  return valor || null;
}

function textoUltimaAtividade(
  historico?: HistoricoFunil,
  agenda?: AgendaFunil
) {
  if (historico && agenda) {
    const dataHistorico = new Date(historico.created_at).getTime();
    const dataAgenda = new Date(
      agenda.data_inicio || agenda.created_at || ""
    ).getTime();

    if (dataAgenda > dataHistorico) {
      return `Agenda: ${agenda.titulo || "Compromisso"}`;
    }

    return `${historico.tipo || "Histórico"}: ${
      historico.descricao?.split("\n")[0] || "Atividade registrada"
    }`;
  }

  if (historico) {
    return `${historico.tipo || "Histórico"}: ${
      historico.descricao?.split("\n")[0] || "Atividade registrada"
    }`;
  }

  if (agenda) {
    return `Agenda: ${agenda.titulo || "Compromisso"}`;
  }

  return "Sem atividade registrada";
}

export function determinarEtapaComercial(
  cliente: ClienteFunil,
  historicos: HistoricoFunil[],
  agendas: AgendaFunil[],
  quantidadeMatches: number,
  quantidadePropostasAtivas = 0,
  quantidadePropostasEstruturadas = 0
): EtapaFunil {
  const status = normalizarTexto(cliente.status);

  if (status === "fechado") {
    return "Fechado";
  }

  const estagios = historicos
    .filter((item) => item.tipo === "interesse_imovel")
    .map((item) => extrairEstagio(item.descricao))
    .filter(Boolean);

  const temPropostaEstruturada = quantidadePropostasEstruturadas > 0;
  const temPropostaLegada =
    status === "proposta" ||
    estagios.includes("proposta") ||
    historicos.some((item) => normalizarTexto(item.tipo) === "proposta");
  const temProposta =
    quantidadePropostasAtivas > 0 ||
    (!temPropostaEstruturada && temPropostaLegada);

  if (temProposta) {
    return "Proposta";
  }

  if (
    estagios.includes("visita_agendada") ||
    agendas.some((item) => item.status !== "concluido")
  ) {
    return "Visita agendada";
  }

  if (estagios.includes("interessado")) {
    return "Interessado";
  }

  if (
    status === "em atendimento" ||
    historicos.length > 0 ||
    agendas.length > 0 ||
    quantidadeMatches > 0
  ) {
    return "Em atendimento";
  }

  return "Novo";
}

export async function listarFunil() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: clientes, error: clientesError } = await supabase
    .from("clientes")
    .select(`
      id,
      nome,
      telefone,
      interesse,
      finalidade,
      bairro,
      cidade,
      valor,
      status,
      created_at,
      updated_at
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (clientesError) {
    console.error("Erro ao carregar clientes do funil:", clientesError);
    return [];
  }

  const clienteIds = (clientes || []).map((cliente) => cliente.id);

  if (clienteIds.length === 0) {
    return [];
  }

  const [
    { data: historico, error: historicoError },
    { data: matches, error: matchesError },
    { data: agenda, error: agendaError },
    { data: propostas, error: propostasError },
    { data: negocios, error: negociosError },
  ] = await Promise.all([
    supabase
      .from("historico")
      .select("cliente_id, tipo, descricao, created_at")
      .in("cliente_id", clienteIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("cliente_matches")
      .select("cliente_id")
      .in("cliente_id", clienteIds),
    supabase
      .from("agenda")
      .select("cliente_id, titulo, descricao, data_inicio, created_at, status")
      .in("cliente_id", clienteIds)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("data_inicio", { ascending: false }),
    supabase
      .from("propostas")
      .select("cliente_id, status")
      .in("cliente_id", clienteIds)
      .eq("corretor_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("negocios")
      .select(`
        id,
        cliente_id,
        imovel_id,
        proposta_id,
        valor_final,
        finalidade,
        data_fechamento,
        imoveis (
          titulo,
          codigo
        )
      `)
      .in("cliente_id", clienteIds)
      .eq("corretor_id", user.id)
      .is("deleted_at", null)
      .order("data_fechamento", { ascending: false }),
  ]);

  if (historicoError) {
    console.error("Erro ao carregar histórico do funil:", historicoError);
  }

  if (matchesError) {
    console.error("Erro ao carregar matches do funil:", matchesError);
  }

  if (agendaError) {
    console.error("Erro ao carregar agenda do funil:", agendaError);
  }

  if (propostasError) {
    console.error(
      "Erro ao carregar propostas do funil:",
      propostasError
    );
  }

  if (negociosError) {
    console.error(
      "Erro ao carregar negócios do funil:",
      negociosError
    );
  }

  const historicoPorCliente = new Map<string, HistoricoFunil[]>();
  const agendaPorCliente = new Map<string, AgendaFunil[]>();
  const matchesPorCliente = new Map<string, number>();
  const propostasAtivasPorCliente = new Map<string, number>();
  const propostasEstruturadasPorCliente = new Map<string, number>();
  const negociosPorCliente = new Map<string, NegocioFunil[]>();

  (historico || []).forEach((item) => {
    if (!item.cliente_id) return;

    historicoPorCliente.set(item.cliente_id, [
      ...(historicoPorCliente.get(item.cliente_id) || []),
      item,
    ]);
  });

  (agenda || []).forEach((item) => {
    if (!item.cliente_id) return;

    agendaPorCliente.set(item.cliente_id, [
      ...(agendaPorCliente.get(item.cliente_id) || []),
      item,
    ]);
  });

  (matches || []).forEach((item) => {
    if (!item.cliente_id) return;

    matchesPorCliente.set(
      item.cliente_id,
      (matchesPorCliente.get(item.cliente_id) || 0) + 1
    );
  });

  ((propostas || []) as PropostaFunil[]).forEach((item) => {
    if (!item.cliente_id) return;

    propostasEstruturadasPorCliente.set(
      item.cliente_id,
      (propostasEstruturadasPorCliente.get(item.cliente_id) || 0) + 1
    );

    if (
      item.status === "enviada" ||
      item.status === "em_negociacao" ||
      item.status === "aceita"
    ) {
      propostasAtivasPorCliente.set(
        item.cliente_id,
        (propostasAtivasPorCliente.get(item.cliente_id) || 0) + 1
      );
    }
  });

  ((negocios || []) as NegocioFunil[]).forEach((item) => {
    if (!item.cliente_id) return;

    negociosPorCliente.set(item.cliente_id, [
      ...(negociosPorCliente.get(item.cliente_id) || []),
      item,
    ]);
  });

  return (clientes || []).map((cliente) => {
    const historicos = historicoPorCliente.get(cliente.id) || [];
    const agendas = agendaPorCliente.get(cliente.id) || [];
    const quantidadeMatches = matchesPorCliente.get(cliente.id) || 0;
    const quantidadePropostasAtivas =
      propostasAtivasPorCliente.get(cliente.id) || 0;
    const quantidadePropostasEstruturadas =
      propostasEstruturadasPorCliente.get(cliente.id) || 0;
    const ultimoHistorico = historicos[0];
    const ultimaAgenda = agendas[0];
    const negociosCliente = negociosPorCliente.get(cliente.id) || [];
    const ultimoNegocio = negociosCliente[0] || null;
    const imovelUltimoNegocio = primeiroRelacionamento(
      ultimoNegocio?.imoveis
    );
    const ultimaData = dataMaisRecente([
      cliente.updated_at,
      cliente.created_at,
      ultimoHistorico?.created_at,
      ultimaAgenda?.data_inicio,
      ultimaAgenda?.created_at,
    ]);

    return {
      ...cliente,
      etapa: determinarEtapaComercial(
        cliente,
        historicos,
        agendas,
        quantidadeMatches,
        quantidadePropostasAtivas,
        quantidadePropostasEstruturadas
      ),
      quantidadeMatches,
      resumoNegocios: {
        quantidade: negociosCliente.length,
        ultimoNegocio: ultimoNegocio
          ? {
              id: ultimoNegocio.id,
              imovelId: ultimoNegocio.imovel_id,
              imovelTitulo: imovelUltimoNegocio?.titulo || null,
              imovelCodigo: imovelUltimoNegocio?.codigo || null,
              finalidade: ultimoNegocio.finalidade,
              valorFinal: ultimoNegocio.valor_final,
              dataFechamento: ultimoNegocio.data_fechamento,
            }
          : null,
      },
      ultimaAtividade: textoUltimaAtividade(
        ultimoHistorico,
        ultimaAgenda
      ),
      ultimaAtividadeEm: ultimaData,
    };
  });
}
