import { supabase } from "@/lib/supabase";

type EtapaFunil =
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

function extrairEstagio(descricao: string | null) {
  if (!descricao) return null;

  const encontrado = descricao.match(
    /Estágio: (interessado|visita_agendada|proposta|sem_interesse)/
  );

  return encontrado?.[1] || null;
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

function determinarEtapa(
  cliente: ClienteFunil,
  historicos: HistoricoFunil[],
  agendas: AgendaFunil[],
  quantidadeMatches: number
): EtapaFunil {
  const status = (cliente.status || "").toLowerCase();

  if (status === "fechado") {
    return "Fechado";
  }

  const estagios = historicos
    .filter((item) => item.tipo === "interesse_imovel")
    .map((item) => extrairEstagio(item.descricao))
    .filter(Boolean);

  if (estagios.includes("proposta")) {
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

  const historicoPorCliente = new Map<string, HistoricoFunil[]>();
  const agendaPorCliente = new Map<string, AgendaFunil[]>();
  const matchesPorCliente = new Map<string, number>();

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

  return (clientes || []).map((cliente) => {
    const historicos = historicoPorCliente.get(cliente.id) || [];
    const agendas = agendaPorCliente.get(cliente.id) || [];
    const quantidadeMatches = matchesPorCliente.get(cliente.id) || 0;
    const ultimoHistorico = historicos[0];
    const ultimaAgenda = agendas[0];
    const ultimaData = dataMaisRecente([
      cliente.updated_at,
      cliente.created_at,
      ultimoHistorico?.created_at,
      ultimaAgenda?.data_inicio,
      ultimaAgenda?.created_at,
    ]);

    return {
      ...cliente,
      etapa: determinarEtapa(
        cliente,
        historicos,
        agendas,
        quantidadeMatches
      ),
      quantidadeMatches,
      ultimaAtividade: textoUltimaAtividade(
        ultimoHistorico,
        ultimaAgenda
      ),
      ultimaAtividadeEm: ultimaData,
    };
  });
}
