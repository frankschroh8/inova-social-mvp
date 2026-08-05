import { supabase } from "@/lib/supabase";

export async function getDashboardData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      clientes: 0,
      imoveis: 0,
      visitas: 0,
    };
  }

  const [{ count: clientes }, { count: imoveis }, { count: visitas }] =
    await Promise.all([
      supabase
        .from("clientes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      supabase
        .from("imoveis")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      supabase
        .from("visitas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  return {
    clientes: clientes ?? 0,
    imoveis: imoveis ?? 0,
    visitas: visitas ?? 0,
  };
}