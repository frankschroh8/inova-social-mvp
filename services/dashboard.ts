import { supabase } from "@/lib/supabase";
import { listarFunil } from "@/services/funil";

const ETAPAS = [
  "Novo",
  "Em atendimento",
  "Interessado",
  "Visita agendada",
  "Proposta",
  "Fechado",
];

function percentual(parte: number, total: number) {
  if (total <= 0) return null;

  return Math.round((parte / total) * 100);
}

export async function getDashboardData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      indicadores: {
        totalClientes: 0,
        novos: 0,
        emAtendimento: 0,
        interessados: 0,
        visitasAgendadas: 0,
        propostas: 0,
        fechados: 0,
        imoveisDisponiveis: 0,
        matchesAtivos: 0,
      },
      taxas: {
        clientesComMatch: null,
        visitaSobreAtivos: null,
        propostaSobreVisitas: null,
        fechamentoSobrePropostas: null,
      },
      atividadesRecentes: [],
      proximasVisitas: [],
      resumoFunil: ETAPAS.map((etapa) => ({
        etapa,
        total: 0,
      })),
    };
  }

  const funil = await listarFunil();
  const clienteIds = funil.map((cliente) => cliente.id);

  if (clienteIds.length === 0) {
    return {
      indicadores: {
        totalClientes: 0,
        novos: 0,
        emAtendimento: 0,
        interessados: 0,
        visitasAgendadas: 0,
        propostas: 0,
        fechados: 0,
        imoveisDisponiveis: 0,
        matchesAtivos: 0,
      },
      taxas: {
        clientesComMatch: null,
        visitaSobreAtivos: null,
        propostaSobreVisitas: null,
        fechamentoSobrePropostas: null,
      },
      atividadesRecentes: [],
      proximasVisitas: [],
      resumoFunil: ETAPAS.map((etapa) => ({
        etapa,
        total: 0,
      })),
    };
  }

  const [
    { count: imoveisDisponiveis, error: imoveisError },
    { data: matches, error: matchesError },
    { data: atividadesRecentes, error: historicoError },
    { data: proximasVisitas, error: agendaError },
  ] = await Promise.all([
      supabase
        .from("imoveis")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "disponivel")
        .is("deleted_at", null),

      supabase
        .from("cliente_matches")
        .select("cliente_id")
        .in("cliente_id", clienteIds),

      supabase
        .from("historico")
        .select(`
          id,
          cliente_id,
          tipo,
          descricao,
          created_at,
          clientes (
            nome
          )
        `)
        .in("cliente_id", clienteIds)
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("agenda")
        .select(`
          id,
          cliente_id,
          titulo,
          descricao,
          data_inicio,
          status,
          clientes (
            nome,
            telefone
          )
        `)
        .eq("user_id", user.id)
        .in("cliente_id", clienteIds)
        .is("deleted_at", null)
        .neq("status", "concluido")
        .gte("data_inicio", new Date().toISOString())
        .order("data_inicio", { ascending: true })
        .limit(6),
    ]);

  if (imoveisError) {
    console.error(
      "Erro ao carregar imóveis disponíveis do dashboard:",
      imoveisError
    );
  }

  if (matchesError) {
    console.error(
      "Erro ao carregar matches do dashboard:",
      matchesError
    );
  }

  if (historicoError) {
    console.error(
      "Erro ao carregar atividades recentes do dashboard:",
      historicoError
    );
  }

  if (agendaError) {
    console.error(
      "Erro ao carregar próximas visitas do dashboard:",
      agendaError
    );
  }

  const resumoFunil = ETAPAS.map((etapa) => ({
    etapa,
    total: funil.filter((cliente) => cliente.etapa === etapa).length,
  }));

  const matchesAtivos = matches?.length || 0;
  const clientesComMatch = new Set(
    (matches || [])
      .map((match) => match.cliente_id)
      .filter(Boolean)
  ).size;
  const totalClientes = funil.length;
  const clientesAtivos = funil.filter(
    (cliente) => cliente.etapa !== "Novo" && cliente.etapa !== "Fechado"
  ).length;
  const visitasAgendadas =
    resumoFunil.find((item) => item.etapa === "Visita agendada")?.total ||
    0;
  const propostas =
    resumoFunil.find((item) => item.etapa === "Proposta")?.total || 0;
  const fechados =
    resumoFunil.find((item) => item.etapa === "Fechado")?.total || 0;

  return {
    indicadores: {
      totalClientes,
      novos:
        resumoFunil.find((item) => item.etapa === "Novo")?.total || 0,
      emAtendimento:
        resumoFunil.find((item) => item.etapa === "Em atendimento")
          ?.total || 0,
      interessados:
        resumoFunil.find((item) => item.etapa === "Interessado")?.total ||
        0,
      visitasAgendadas,
      propostas,
      fechados,
      imoveisDisponiveis: imoveisDisponiveis ?? 0,
      matchesAtivos,
    },
    taxas: {
      clientesComMatch: percentual(clientesComMatch, totalClientes),
      visitaSobreAtivos: percentual(visitasAgendadas, clientesAtivos),
      propostaSobreVisitas: percentual(propostas, visitasAgendadas),
      fechamentoSobrePropostas: percentual(fechados, propostas),
    },
    atividadesRecentes: atividadesRecentes || [],
    proximasVisitas: proximasVisitas || [],
    resumoFunil,
  };
}
