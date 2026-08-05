import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
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