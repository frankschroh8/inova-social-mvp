import { supabase } from "@/lib/supabase";

type Relacao<T> = T | T[] | null | undefined;

interface ClienteNegocio {
  nome: string | null;
  telefone: string | null;
}

interface ImovelNegocio {
  titulo: string | null;
  codigo: string | null;
  bairro: string | null;
  cidade: string | null;
}

interface PropostaNegocio {
  id: string;
  valor: number | string | null;
  status: string | null;
}

interface NegocioBanco {
  id: string;
  cliente_id: string;
  imovel_id: string;
  proposta_id: string | null;
  valor_final: number | string | null;
  finalidade: string | null;
  data_fechamento: string | null;
  observacoes: string | null;
  clientes?: Relacao<ClienteNegocio>;
  imoveis?: Relacao<ImovelNegocio>;
  propostas?: Relacao<PropostaNegocio>;
}

export interface NegocioListado {
  id: string;
  cliente_id: string;
  imovel_id: string;
  proposta_id: string | null;
  valor_final: number | string | null;
  finalidade: string | null;
  data_fechamento: string | null;
  observacoes: string | null;
  cliente: ClienteNegocio | null;
  imovel: ImovelNegocio | null;
  proposta: PropostaNegocio | null;
}

function primeiroRelacionamento<T>(valor: Relacao<T>) {
  if (Array.isArray(valor)) {
    return valor[0] || null;
  }

  return valor || null;
}

export async function listarNegocios() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("negocios")
    .select(`
      id,
      cliente_id,
      imovel_id,
      proposta_id,
      valor_final,
      finalidade,
      data_fechamento,
      observacoes,
      clientes (
        nome,
        telefone
      ),
      imoveis (
        titulo,
        codigo,
        bairro,
        cidade
      ),
      propostas (
        id,
        valor,
        status
      )
    `)
    .eq("corretor_id", user.id)
    .is("deleted_at", null)
    .order("data_fechamento", { ascending: false });

  if (error) {
    console.error("Erro ao carregar negócios:", error);
    return [];
  }

  return ((data || []) as NegocioBanco[]).map((negocio) => ({
    id: negocio.id,
    cliente_id: negocio.cliente_id,
    imovel_id: negocio.imovel_id,
    proposta_id: negocio.proposta_id,
    valor_final: negocio.valor_final,
    finalidade: negocio.finalidade,
    data_fechamento: negocio.data_fechamento,
    observacoes: negocio.observacoes,
    cliente: primeiroRelacionamento(negocio.clientes),
    imovel: primeiroRelacionamento(negocio.imoveis),
    proposta: primeiroRelacionamento(negocio.propostas),
  }));
}
