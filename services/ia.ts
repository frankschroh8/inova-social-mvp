import { supabase } from "@/lib/supabase";

export async function perguntarIA(prompt: string) {
  const { data: sessionData } = await supabase.auth.getSession();

  const response = await fetch("/api/ia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionData.session?.access_token
        ? { Authorization: `Bearer ${sessionData.session.access_token}` }
        : {}),
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error("Erro ao consultar IA");
  }

  return response.json();
}
