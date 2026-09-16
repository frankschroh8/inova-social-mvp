import { supabase } from "@/lib/supabase";

export async function registrarUltimoContato(
  clienteId: string,
  usuarioId?: string,
  data?: string | Date
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não está logado.");
  }

  if (usuarioId && usuarioId !== user.id) {
    throw new Error("Usuário autenticado não corresponde ao contato.");
  }

  const agora = new Date().toISOString();
  const dataContato =
    data instanceof Date
      ? data.toISOString()
      : data || agora;

  const { error } = await supabase
    .from("clientes")
    .update({
      ultimo_contato: dataContato,
      updated_at: agora,
    })
    .eq("id", clienteId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(
      `Erro ao atualizar último contato: ${error.message}`
    );
  }
}

export async function registrarContatoCliente({
  clienteId,
  descricao,
  proximoContato,
}: {
  clienteId: string;
  descricao: string;
  proximoContato?: string | null;
}) {
  const observacao = descricao.trim();

  if (!observacao) {
    throw new Error("Digite uma observação sobre o contato.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não está logado.");
  }

  const { data: cliente, error: clienteBuscaError } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (clienteBuscaError) {
    throw new Error(
      `Erro ao validar cliente: ${clienteBuscaError.message}`
    );
  }

  if (!cliente) {
    throw new Error("Cliente não encontrado para o usuário autenticado.");
  }

  const agora = new Date().toISOString();

  const { error: historicoError } = await supabase
    .from("historico")
    .insert({
      cliente_id: clienteId,
      usuario_id: user.id,
      tipo: "contato",
      descricao: observacao,
    });

  if (historicoError) {
    throw new Error(
      `Erro ao registrar contato: ${historicoError.message}`
    );
  }

  const { error: clienteError } = await supabase
    .from("clientes")
    .update({
      proximo_contato: proximoContato
        ? new Date(proximoContato).toISOString()
        : null,
      updated_at: agora,
    })
    .eq("id", clienteId)
    .eq("user_id", user.id);

  if (clienteError) {
    throw new Error(
      `Contato salvo, mas houve erro ao atualizar a data: ${clienteError.message}`
    );
  }

  await registrarUltimoContato(clienteId, user.id, agora);
}
