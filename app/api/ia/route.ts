import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { prompt, email } = await req.json();

    // 🔍 buscar usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    // ❌ BLOQUEIO FREE
    if (profile?.plan !== "pro" && profile?.ai_usage >= 5) {
      return NextResponse.json(
        { error: "Limite atingido. Faça upgrade PRO." },
        { status: 403 }
      );
    }

    // 🤖 IA OpenAI
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `
Crie uma legenda viral para redes sociais:

"${prompt}"

Inclua hashtags e tom motivacional.
            `,
          },
        ],
      }),
    });

    const data = await res.json();
    const texto = data?.choices?.[0]?.message?.content;

    // 📊 atualizar uso
    await supabase
      .from("profiles")
      .update({ ai_usage: (profile?.ai_usage || 0) + 1 })
      .eq("email", email);

    return NextResponse.json({ texto });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}