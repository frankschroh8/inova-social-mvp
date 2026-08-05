import { supabase } from "@/lib/supabase";

export async function listarAgenda() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("agenda")
    .select("*")
    .eq("user_id", user.id)
    .order("data", { ascending: true });

  return data || [];
}

export async function criarCompromisso(compromisso: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  return supabase.from("agenda").insert({
    ...compromisso,
    user_id: user.id,
  });
}