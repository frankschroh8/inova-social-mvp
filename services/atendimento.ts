import { supabase } from "@/lib/supabase";
import {
  classificarFollowUp,
  type SituacaoFollowUp,
} from "@/services/followups";
import { listarFunil, type EtapaFunil } from "@/services/funil";
import {
  avaliarClienteEsfriando,
  obterLimitesDiaBrasil,
} from "@/services/regrasAtendimento";

export type PrioridadeAtendimento = "Alta" | "Média" | "Normal";
export type GrupoAtendimento =
  | "atrasado"
  | "hoje"
  | "esfriando"
  | "sem_proximo_contato"
  | "proximo";

export interface AtendimentoItem {
  id: string;
  nome: string;
  telefone: string | null;
  etapa: Exclude<EtapaFunil, "Fechado">;
  ultimo_contato: string | null;
  proximo_contato: string | null;
  prioridade: PrioridadeAtendimento;
  motivo: string;
  grupo: GrupoAtendimento;
  diasSemContato: number | null;
}

export interface AtendimentoResumo {
  atrasados: number;
  hoje: number;
  esfriando: number;
  semProximoContato: number;
  proximos7Dias: number;
  agendaHoje: number;
}

export interface AgendaHojeItem {
  id: string;
  cliente_id: string | null;
  cliente_nome: string | null;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  status: "agendado" | "reagendado";
}

interface AgendaHojeBanco {
  id: string;
  cliente_id: string | null;
  titulo: string | null;
  descricao: string | null;
  data_inicio: string | null;
  status: string | null;
}

interface ClienteContato {
  id: string;
  nome: string;
  telefone: string | null;
  ultimo_contato: string | null;
  proximo_contato: string | null;
}

type LeadFunil = Awaited<ReturnType<typeof listarFunil>>[number];

const prioridadePeso: Record<PrioridadeAtendimento, number> = {
  Alta: 0,
  Média: 1,
  Normal: 2,
};

const grupoPeso: Record<GrupoAtendimento, number> = {
  atrasado: 0,
  hoje: 1,
  esfriando: 2,
  sem_proximo_contato: 3,
  proximo: 4,
};

function prioridadeSemProximoContato(etapa: EtapaFunil) {
  if (etapa === "Proposta" || etapa === "Visita agendada") {
    return {
      prioridade: "Alta" as const,
      motivo:
        etapa === "Proposta"
          ? "Proposta sem próximo contato"
          : "Visita sem próximo contato",
    };
  }

  if (etapa === "Interessado") {
    return {
      prioridade: "Média" as const,
      motivo: "Interessado sem próximo contato",
    };
  }

  return {
    prioridade: "Normal" as const,
    motivo: "Sem próximo contato",
  };
}

function prioridadeComFollowUp(situacao: SituacaoFollowUp) {
  if (situacao === "atrasado") {
    return {
      prioridade: "Alta" as const,
      motivo: "Follow-up atrasado",
      grupo: "atrasado" as const,
    };
  }

  if (situacao === "hoje") {
    return {
      prioridade: "Média" as const,
      motivo: "Contato previsto para hoje",
      grupo: "hoje" as const,
    };
  }

  return {
    prioridade: "Normal" as const,
    motivo: "Próximo contato agendado",
    grupo: "proximo" as const,
  };
}

function dataOrdenacao(item: AtendimentoItem) {
  if (item.proximo_contato) {
    return new Date(item.proximo_contato).getTime();
  }

  if (item.ultimo_contato) {
    return new Date(item.ultimo_contato).getTime();
  }

  return 0;
}

function ordenarAtendimento(a: AtendimentoItem, b: AtendimentoItem) {
  const prioridade =
    prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade];

  if (prioridade !== 0) return prioridade;

  const grupo = grupoPeso[a.grupo] - grupoPeso[b.grupo];

  if (grupo !== 0) return grupo;

  return dataOrdenacao(a) - dataOrdenacao(b);
}

async function listarAgendaHoje(userId: string) {
  const { inicio, fimExclusivo } = obterLimitesDiaBrasil();
  const { data, error } = await supabase
    .from("agenda")
    .select(`
      id,
      cliente_id,
      titulo,
      descricao,
      data_inicio,
      status
    `)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .in("status", ["agendado", "reagendado"])
    .gte("data_inicio", inicio)
    .lt("data_inicio", fimExclusivo)
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("Erro na consulta principal da agenda de hoje:", error);
    return [] as AgendaHojeItem[];
  }

  const compromissos = ((data || []) as AgendaHojeBanco[])
    .filter(
      (item) =>
        item.data_inicio &&
        item.titulo &&
        (item.status === "agendado" || item.status === "reagendado")
    );
  const clienteIds = Array.from(
    new Set(
      compromissos
        .map((item) => item.cliente_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const clientesPorId = new Map<string, string>();

  if (clienteIds.length > 0) {
    const { data: clientes, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nome")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .in("id", clienteIds);

    if (clientesError) {
      console.error(
        "Erro ao carregar clientes da agenda de hoje:",
        clientesError
      );
    } else {
      (clientes || []).forEach((cliente) => {
        clientesPorId.set(cliente.id, cliente.nome);
      });
    }
  }

  return compromissos
    .map((item) => ({
      id: item.id,
      cliente_id: item.cliente_id,
      cliente_nome: item.cliente_id
        ? clientesPorId.get(item.cliente_id) || null
        : null,
      titulo: item.titulo as string,
      descricao: item.descricao,
      data_inicio: item.data_inicio as string,
      status: item.status as "agendado" | "reagendado",
    }));
}

export async function listarAtendimento() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      resumo: {
        atrasados: 0,
        hoje: 0,
        esfriando: 0,
        semProximoContato: 0,
        proximos7Dias: 0,
        agendaHoje: 0,
      },
      itens: [] as AtendimentoItem[],
      agendaHoje: [] as AgendaHojeItem[],
    };
  }

  const [funil, agendaHoje] = await Promise.all([
    listarFunil(),
    listarAgendaHoje(user.id),
  ]);
  const leadsOperacionais = funil.filter(
    (lead) => lead.etapa !== "Fechado"
  );
  const clienteIds = leadsOperacionais.map((lead) => lead.id);

  if (clienteIds.length === 0) {
    return {
      resumo: {
        atrasados: 0,
        hoje: 0,
        esfriando: 0,
        semProximoContato: 0,
        proximos7Dias: 0,
        agendaHoje: agendaHoje.length,
      },
      itens: [] as AtendimentoItem[],
      agendaHoje,
    };
  }

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("id, nome, telefone, ultimo_contato, proximo_contato")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .in("id", clienteIds);

  if (error) {
    console.error("Erro ao carregar clientes da central de atendimento:", error);

    return {
      resumo: {
        atrasados: 0,
        hoje: 0,
        esfriando: 0,
        semProximoContato: 0,
        proximos7Dias: 0,
        agendaHoje: agendaHoje.length,
      },
      itens: [] as AtendimentoItem[],
      agendaHoje,
    };
  }

  const contatosPorCliente = new Map<string, ClienteContato>();

  ((clientes || []) as ClienteContato[]).forEach((cliente) => {
    contatosPorCliente.set(cliente.id, cliente);
  });

  const itens = leadsOperacionais
    .map((lead: LeadFunil) => {
      const contato = contatosPorCliente.get(lead.id);

      if (!contato || lead.etapa === "Fechado") return null;

      const situacao = classificarFollowUp(contato.proximo_contato);
      const esfriamento = avaliarClienteEsfriando({
        etapa: lead.etapa,
        ultimoContato: contato.ultimo_contato,
        proximoContato: contato.proximo_contato,
      });

      if (situacao) {
        const classificacao = prioridadeComFollowUp(situacao);

        return {
          id: lead.id,
          nome: contato.nome || lead.nome,
          telefone: contato.telefone,
          etapa: lead.etapa,
          ultimo_contato: contato.ultimo_contato,
          proximo_contato: contato.proximo_contato,
          prioridade: classificacao.prioridade,
          motivo: classificacao.motivo,
          grupo: classificacao.grupo,
          diasSemContato: esfriamento.diasSemContato,
        };
      }

      if (contato.proximo_contato) {
        return null;
      }

      const semProximo = prioridadeSemProximoContato(lead.etapa);
      const prioridade = esfriamento.esfriando
        ? semProximo.prioridade === "Alta"
          ? "Alta"
          : "Média"
        : semProximo.prioridade;
      const grupo = esfriamento.esfriando
        ? "esfriando"
        : "sem_proximo_contato";
      const motivo =
        esfriamento.esfriando && esfriamento.diasSemContato !== null
          ? `Cliente esfriando — ${esfriamento.diasSemContato} dias sem contato`
          : semProximo.motivo;

      return {
        id: lead.id,
        nome: contato.nome || lead.nome,
        telefone: contato.telefone,
        etapa: lead.etapa,
        ultimo_contato: contato.ultimo_contato,
        proximo_contato: null,
        prioridade,
        motivo,
        grupo,
        diasSemContato: esfriamento.diasSemContato,
      };
    })
    .filter(Boolean) as AtendimentoItem[];

  itens.sort(ordenarAtendimento);

  return {
    resumo: {
      atrasados: itens.filter((item) => item.grupo === "atrasado").length,
      hoje: itens.filter((item) => item.grupo === "hoje").length,
      esfriando: itens.filter((item) => item.grupo === "esfriando").length,
      semProximoContato: itens.filter(
        (item) => item.grupo === "sem_proximo_contato"
      ).length,
      proximos7Dias: itens.filter((item) => item.grupo === "proximo").length,
      agendaHoje: agendaHoje.length,
    },
    itens,
    agendaHoje,
  };
}
