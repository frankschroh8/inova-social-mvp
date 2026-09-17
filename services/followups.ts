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
    .select("id, nome, telefone, proximo_contato")
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

  const itens = (data || [])
    .map((cliente) => {
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
