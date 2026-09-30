import { supabase } from "@/lib/supabase";
import { calcularDiasDesdeBrasil } from "@/services/regrasAtendimento";

interface ClientePosVendaBanco {
  id: string;
  nome: string | null;
  telefone: string | null;
  ultimo_contato: string | null;
  proximo_contato: string | null;
  status: string | null;
}

interface NegocioPosVendaBanco {
  id: string;
  cliente_id: string;
  imovel_id: string;
  finalidade: string | null;
  valor_final: number | string | null;
  data_fechamento: string | null;
}

interface ImovelPosVendaBanco {
  id: string;
  titulo: string | null;
  codigo: string | null;
}

export interface UltimoNegocioPosVenda {
  negocioId: string;
  imovelId: string;
  imovelTitulo: string | null;
  imovelCodigo: string | null;
  finalidade: string | null;
  valorFinal: number | string | null;
  dataFechamento: string | null;
}

export interface PosVendaItem {
  clienteId: string;
  nome: string;
  telefone: string | null;
  ultimoContato: string | null;
  proximoContato: string | null;
  tipo: "estruturado" | "legado";
  quantidadeNegocios: number;
  ultimoNegocio: UltimoNegocioPosVenda | null;
  diasDesdeFechamento: number | null;
}

function statusFechado(status: string | null) {
  return (status || "").trim().toLowerCase() === "fechado";
}

function instante(data: string | null) {
  if (!data) return Number.NEGATIVE_INFINITY;

  const valor = new Date(data).getTime();

  return Number.isFinite(valor) ? valor : Number.NEGATIVE_INFINITY;
}

export async function listarPosVenda(): Promise<PosVendaItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const [clientesResultado, negociosResultado] = await Promise.all([
    supabase
      .from("clientes")
      .select(
        "id, nome, telefone, ultimo_contato, proximo_contato, status"
      )
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("negocios")
      .select(
        "id, cliente_id, imovel_id, finalidade, valor_final, data_fechamento"
      )
      .eq("corretor_id", user.id)
      .is("deleted_at", null)
      .order("data_fechamento", { ascending: false }),
  ]);

  if (clientesResultado.error) {
    console.error("Erro ao carregar clientes do pós-venda:", {
      message: clientesResultado.error.message,
      code: clientesResultado.error.code,
      details: clientesResultado.error.details,
      hint: clientesResultado.error.hint,
    });
    throw new Error("Não foi possível carregar os clientes do pós-venda.");
  }

  if (negociosResultado.error) {
    console.error("Erro ao carregar negócios do pós-venda:", {
      message: negociosResultado.error.message,
      code: negociosResultado.error.code,
      details: negociosResultado.error.details,
      hint: negociosResultado.error.hint,
    });
    throw new Error("Não foi possível carregar os negócios do pós-venda.");
  }

  const clientes = (clientesResultado.data || []) as ClientePosVendaBanco[];
  const negocios = (negociosResultado.data || []) as NegocioPosVendaBanco[];
  const imovelIds = Array.from(
    new Set(negocios.map((negocio) => negocio.imovel_id).filter(Boolean))
  );
  const imoveisPorId = new Map<string, ImovelPosVendaBanco>();

  if (imovelIds.length > 0) {
    const { data: imoveis, error: imoveisError } = await supabase
      .from("imoveis")
      .select("id, titulo, codigo")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .in("id", imovelIds);

    if (imoveisError) {
      console.error("Erro ao carregar imóveis do pós-venda:", {
        message: imoveisError.message,
        code: imoveisError.code,
        details: imoveisError.details,
        hint: imoveisError.hint,
      });
      throw new Error("Não foi possível carregar os imóveis do pós-venda.");
    }

    ((imoveis || []) as ImovelPosVendaBanco[]).forEach((imovel) => {
      imoveisPorId.set(imovel.id, imovel);
    });
  }

  const negociosPorCliente = new Map<string, NegocioPosVendaBanco[]>();

  negocios.forEach((negocio) => {
    negociosPorCliente.set(negocio.cliente_id, [
      ...(negociosPorCliente.get(negocio.cliente_id) || []),
      negocio,
    ]);
  });

  negociosPorCliente.forEach((itens) => {
    itens.sort(
      (a, b) => instante(b.data_fechamento) - instante(a.data_fechamento)
    );
  });

  const itens = clientes
    .map((cliente): PosVendaItem | null => {
      const negociosCliente = negociosPorCliente.get(cliente.id) || [];
      const ultimoNegocio = negociosCliente[0] || null;

      if (!ultimoNegocio && !statusFechado(cliente.status)) {
        return null;
      }

      if (!ultimoNegocio) {
        return {
          clienteId: cliente.id,
          nome: cliente.nome || "Cliente sem nome",
          telefone: cliente.telefone,
          ultimoContato: cliente.ultimo_contato,
          proximoContato: cliente.proximo_contato,
          tipo: "legado",
          quantidadeNegocios: 0,
          ultimoNegocio: null,
          diasDesdeFechamento: null,
        };
      }

      const imovel = imoveisPorId.get(ultimoNegocio.imovel_id) || null;

      return {
        clienteId: cliente.id,
        nome: cliente.nome || "Cliente sem nome",
        telefone: cliente.telefone,
        ultimoContato: cliente.ultimo_contato,
        proximoContato: cliente.proximo_contato,
        tipo: "estruturado",
        quantidadeNegocios: negociosCliente.length,
        ultimoNegocio: {
          negocioId: ultimoNegocio.id,
          imovelId: ultimoNegocio.imovel_id,
          imovelTitulo: imovel?.titulo || null,
          imovelCodigo: imovel?.codigo || null,
          finalidade: ultimoNegocio.finalidade,
          valorFinal: ultimoNegocio.valor_final,
          dataFechamento: ultimoNegocio.data_fechamento,
        },
        diasDesdeFechamento: calcularDiasDesdeBrasil(
          ultimoNegocio.data_fechamento
        ),
      };
    })
    .filter((item): item is PosVendaItem => item !== null);

  itens.sort((a, b) => {
    if (a.tipo !== b.tipo) {
      return a.tipo === "estruturado" ? -1 : 1;
    }

    if (a.tipo === "estruturado" && b.tipo === "estruturado") {
      const diferenca =
        instante(b.ultimoNegocio?.dataFechamento || null) -
        instante(a.ultimoNegocio?.dataFechamento || null);

      if (diferenca !== 0) return diferenca;
    }

    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  return itens;
}
