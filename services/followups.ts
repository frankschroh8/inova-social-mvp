import { supabase } from "@/lib/supabase";
import {
  calcularDiferencaDiasBrasil,
  calcularDiasDesdeBrasil,
} from "@/services/regrasAtendimento";

export type SituacaoFollowUp = "atrasado" | "hoje" | "proximo";

export interface FollowUpOperacional {
  id: string;
  nome: string;
  telefone: string | null;
  proximo_contato: string;
  situacao: SituacaoFollowUp;
}

interface ClienteFollowUp {
  id: string;
  nome: string;
  telefone: string | null;
  proximo_contato: string | null;
  status: string | null;
}

interface NegocioFechado {
  cliente_id: string;
  data_fechamento: string | null;
}

export { calcularDiferencaDiasBrasil, calcularDiasDesdeBrasil };

export function classificarFollowUp(
  proximoContato: string | null | undefined,
  referencia = new Date()
): SituacaoFollowUp | null {
  const diferencaDias = calcularDiferencaDiasBrasil(
    proximoContato,
    referencia
  );

  if (diferencaDias === null) return null;

  if (diferencaDias < 0) {
    return "atrasado";
  }

  if (diferencaDias === 0) {
    return "hoje";
  }

  if (diferencaDias <= 7) {
    return "proximo";
  }

  return null;
}

export function followUpPertenceAoCicloEncerrado(
  proximoContato: string | null | undefined,
  dataFechamento: string | null | undefined
) {
  if (!proximoContato || !dataFechamento) return false;

  const proximoContatoMs = new Date(proximoContato).getTime();
  const dataFechamentoMs = new Date(dataFechamento).getTime();

  if (
    !Number.isFinite(proximoContatoMs) ||
    !Number.isFinite(dataFechamentoMs)
  ) {
    return false;
  }

  return proximoContatoMs <= dataFechamentoMs;
}

function prioridadeSituacao(situacao: SituacaoFollowUp) {
  const prioridades: Record<SituacaoFollowUp, number> = {
    atrasado: 0,
    hoje: 1,
    proximo: 2,
  };

  return prioridades[situacao];
}

export async function listarFollowUpsOperacionais() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      resumo: {
        atrasados: 0,
        hoje: 0,
        proximos: 0,
      },
      itens: [] as FollowUpOperacional[],
    };
  }

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, telefone, proximo_contato, status")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .not("proximo_contato", "is", null);

  if (error) {
    console.error("Erro ao carregar follow-ups:", error);

    return {
      resumo: {
        atrasados: 0,
        hoje: 0,
        proximos: 0,
      },
      itens: [] as FollowUpOperacional[],
    };
  }

  const clientes = (data || []) as ClienteFollowUp[];
  const clientesFechadosIds = clientes
    .filter(
      (cliente) => (cliente.status || "").trim().toLowerCase() === "fechado"
    )
    .map((cliente) => cliente.id);
  const ultimoFechamentoPorCliente = new Map<string, string>();

  if (clientesFechadosIds.length > 0) {
    const { data: negocios, error: negociosError } = await supabase
      .from("negocios")
      .select("cliente_id, data_fechamento")
      .eq("corretor_id", user.id)
      .is("deleted_at", null)
      .in("cliente_id", clientesFechadosIds);

    if (negociosError) {
      console.error(
        "Erro ao carregar fechamentos para classificar follow-ups:",
        negociosError
      );
    } else {
      ((negocios || []) as NegocioFechado[]).forEach((negocio) => {
        if (!negocio.cliente_id || !negocio.data_fechamento) return;

        const dataAtual = ultimoFechamentoPorCliente.get(negocio.cliente_id);
        const fechamentoMs = new Date(negocio.data_fechamento).getTime();
        const dataAtualMs = dataAtual
          ? new Date(dataAtual).getTime()
          : Number.NEGATIVE_INFINITY;

        if (Number.isFinite(fechamentoMs) && fechamentoMs > dataAtualMs) {
          ultimoFechamentoPorCliente.set(
            negocio.cliente_id,
            negocio.data_fechamento
          );
        }
      });
    }
  }

  const itens = clientes
    .map((cliente) => {
      const ultimoFechamento = ultimoFechamentoPorCliente.get(cliente.id);

      if (
        followUpPertenceAoCicloEncerrado(
          cliente.proximo_contato,
          ultimoFechamento
        )
      ) {
        return null;
      }

      const situacao = classificarFollowUp(cliente.proximo_contato);

      if (!situacao || !cliente.proximo_contato) {
        return null;
      }

      return {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        proximo_contato: cliente.proximo_contato,
        situacao,
      };
    })
    .filter(Boolean) as FollowUpOperacional[];

  itens.sort((a, b) => {
    const prioridade =
      prioridadeSituacao(a.situacao) - prioridadeSituacao(b.situacao);

    if (prioridade !== 0) {
      return prioridade;
    }

    return (
      new Date(a.proximo_contato).getTime() -
      new Date(b.proximo_contato).getTime()
    );
  });

  return {
    resumo: {
      atrasados: itens.filter((item) => item.situacao === "atrasado").length,
      hoje: itens.filter((item) => item.situacao === "hoje").length,
      proximos: itens.filter((item) => item.situacao === "proximo").length,
    },
    itens,
  };
}
