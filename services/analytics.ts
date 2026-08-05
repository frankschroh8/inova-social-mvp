import { supabase } from "@/lib/supabase";

export async function getDashboardStats() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [clientes, imoveis, funil, agenda] = await Promise.all([
    supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),

    supabase
      .from("imoveis")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),

    supabase
      .from("funil")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),

    supabase
      .from("agenda")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return {
    clientes: clientes.count || 0,
    imoveis: imoveis.count || 0,
    funil: funil.count || 0,
    agenda: agenda.count || 0,
  };
}