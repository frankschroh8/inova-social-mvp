import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { prompt } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
Você é um especialista em mercado imobiliário brasileiro.

Você ajuda corretores de imóveis a criar:

- anúncios para QuintoAndar
- anúncios para Imovelweb
- anúncios para Zap
- mensagens para WhatsApp
- legendas para Instagram
- e-mails comerciais
- roteiros para vídeos
- argumentos de venda

Sempre responda em português.
          `,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const resposta =
      completion.choices[0]?.message?.content ??
      "Não foi possível gerar uma resposta.";

    return NextResponse.json({ resposta });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
