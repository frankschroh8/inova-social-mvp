import { supabase } from "@/lib/supabase";

export async function listarFunil() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("funil")
    .select(`
      *,
      clientes (
        id,
        nome,
        telefone
      )
    `)
    .eq("user_id", user.id)
    .order("created_at");

  return data || [];
}