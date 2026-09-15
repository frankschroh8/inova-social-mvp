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
