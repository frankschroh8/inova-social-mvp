import { supabase } from "@/lib/supabase";
import { listarFunil } from "@/services/funil";
import { listarFollowUpsOperacionais } from "@/services/followups";

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

function followUpsVazios() {
  return {
    resumo: {
      atrasados: 0,
      hoje: 0,
      proximos: 0,
    },
    itens: [],
  };
}

function resultadosComerciaisVazios() {
  return {
    mesAtual: {
      negocios: 0,
      valorTotal: 0,
      vendas: 0,
      valorVendas: 0,
      locacoes: 0,
      valorLocacoes: 0,
      ticketMedio: 0,
    },
    mesAnterior: {
      negocios: 0,
      valorTotal: 0,
    },
    historico: {
      negocios: 0,
      valorTotal: 0,
      ticketMedio: 0,
    },
    comparativo: {
      diferencaNegocios: 0,
      diferencaValor: 0,
    },
    recentes: [],
  };
}

function chaveMesSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(data);
  const ano = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  return `${ano}-${mes}`;
}

function chaveMesAnterior(chaveMes: string) {
  const [anoTexto, mesTexto] = chaveMes.split("-");
  let ano = Number(anoTexto);
  let mes = Number(mesTexto) - 1;

  if (mes === 0) {
    mes = 12;
    ano -= 1;
  }

  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function somarValores(itens: { valor_final: number | string | null }[]) {
  return itens.reduce(
    (total, item) => total + Number(item.valor_final || 0),
    0
  );
}

function ticketMedio(valorTotal: number, quantidade: number) {
  if (quantidade <= 0) return 0;

  return Math.round(valorTotal / quantidade);
}

function primeiroRelacionamento<T>(valor: T | T[] | null | undefined) {
  if (Array.isArray(valor)) {
    return valor[0] || null;
  }

  return valor || null;
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
      followUps: followUpsVazios(),
      resultadosComerciais: resultadosComerciaisVazios(),
      resumoFunil: ETAPAS.map((etapa) => ({
        etapa,
        total: 0,
      })),
    };
  }

  const funil = await listarFunil();
  const followUps = await listarFollowUpsOperacionais();
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
      followUps,
      resultadosComerciais: resultadosComerciaisVazios(),
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
    { data: negocios, error: negociosError },
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
          clientes (
            nome
          ),
          imoveis (
            titulo,
            codigo
          )
        `)
        .eq("corretor_id", user.id)
        .is("deleted_at", null)
        .order("data_fechamento", { ascending: false }),
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

  if (negociosError) {
    console.error(
      "Erro ao carregar negócios do dashboard:",
      negociosError
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
  const negociosCarregados = negocios || [];
  const mesAtualChave = chaveMesSaoPaulo(new Date());
  const mesAnteriorChave = chaveMesAnterior(mesAtualChave);
  const negociosMesAtual = negociosCarregados.filter(
    (negocio) =>
      chaveMesSaoPaulo(new Date(negocio.data_fechamento)) ===
      mesAtualChave
  );
  const negociosMesAnterior = negociosCarregados.filter(
    (negocio) =>
      chaveMesSaoPaulo(new Date(negocio.data_fechamento)) ===
      mesAnteriorChave
  );
  const vendasMesAtual = negociosMesAtual.filter(
    (negocio) => negocio.finalidade === "venda"
  );
  const locacoesMesAtual = negociosMesAtual.filter(
    (negocio) => negocio.finalidade === "locacao"
  );
  const valorMesAtual = somarValores(negociosMesAtual);
  const valorMesAnterior = somarValores(negociosMesAnterior);
  const valorHistorico = somarValores(negociosCarregados);
  const resultadosComerciais = {
    mesAtual: {
      negocios: negociosMesAtual.length,
      valorTotal: valorMesAtual,
      vendas: vendasMesAtual.length,
      valorVendas: somarValores(vendasMesAtual),
      locacoes: locacoesMesAtual.length,
      valorLocacoes: somarValores(locacoesMesAtual),
      ticketMedio: ticketMedio(valorMesAtual, negociosMesAtual.length),
    },
    mesAnterior: {
      negocios: negociosMesAnterior.length,
      valorTotal: valorMesAnterior,
    },
    historico: {
      negocios: negociosCarregados.length,
      valorTotal: valorHistorico,
      ticketMedio: ticketMedio(valorHistorico, negociosCarregados.length),
    },
    comparativo: {
      diferencaNegocios:
        negociosMesAtual.length - negociosMesAnterior.length,
      diferencaValor: valorMesAtual - valorMesAnterior,
    },
    recentes: negociosCarregados.slice(0, 5).map((negocio) => {
      const cliente = primeiroRelacionamento<{
        nome: string | null;
      }>(negocio.clientes);
      const imovel = primeiroRelacionamento<{
        titulo: string | null;
        codigo: string | null;
      }>(negocio.imoveis);

      return {
        id: negocio.id,
        cliente: cliente?.nome || "Cliente",
        imovel: imovel?.titulo || "Imóvel",
        codigo: imovel?.codigo || null,
        finalidade: negocio.finalidade,
        valor_final: negocio.valor_final,
        data_fechamento: negocio.data_fechamento,
      };
    }),
  };

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
    followUps,
    resultadosComerciais,
    resumoFunil,
  };
}
