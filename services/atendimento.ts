import { supabase } from "@/lib/supabase";
import {
  classificarFollowUp,
  type SituacaoFollowUp,
} from "@/services/followups";
import { listarFunil, type EtapaFunil } from "@/services/funil";

export type PrioridadeAtendimento = "Alta" | "Média" | "Normal";
export type GrupoAtendimento =
  | "atrasado"
  | "hoje"
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
}

export interface AtendimentoResumo {
  atrasados: number;
  hoje: number;
  semProximoContato: number;
  proximos7Dias: number;
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
  sem_proximo_contato: 2,
  proximo: 3,
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

export async function listarAtendimento() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      resumo: {
        atrasados: 0,
        hoje: 0,
        semProximoContato: 0,
        proximos7Dias: 0,
      },
      itens: [] as AtendimentoItem[],
    };
  }

  const funil = await listarFunil();
  const leadsOperacionais = funil.filter(
    (lead) => lead.etapa !== "Fechado"
  );
  const clienteIds = leadsOperacionais.map((lead) => lead.id);

  if (clienteIds.length === 0) {
    return {
      resumo: {
        atrasados: 0,
        hoje: 0,
        semProximoContato: 0,
        proximos7Dias: 0,
      },
      itens: [] as AtendimentoItem[],
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
        semProximoContato: 0,
        proximos7Dias: 0,
      },
      itens: [] as AtendimentoItem[],
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
        };
      }

      if (contato.proximo_contato) {
        return null;
      }

      const semProximo = prioridadeSemProximoContato(lead.etapa);

      return {
        id: lead.id,
        nome: contato.nome || lead.nome,
        telefone: contato.telefone,
        etapa: lead.etapa,
        ultimo_contato: contato.ultimo_contato,
        proximo_contato: null,
        prioridade: semProximo.prioridade,
        motivo: semProximo.motivo,
        grupo: "sem_proximo_contato" as const,
      };
    })
    .filter(Boolean) as AtendimentoItem[];

  itens.sort(ordenarAtendimento);

  return {
    resumo: {
      atrasados: itens.filter((item) => item.grupo === "atrasado").length,
      hoje: itens.filter((item) => item.grupo === "hoje").length,
      semProximoContato: itens.filter(
        (item) => item.grupo === "sem_proximo_contato"
      ).length,
      proximos7Dias: itens.filter((item) => item.grupo === "proximo").length,
    },
    itens,
  };
}
