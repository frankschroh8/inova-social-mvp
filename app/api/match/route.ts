import { buscarMatches } from "@/services/match";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const clienteId = searchParams.get("clienteId");

    if (!clienteId) {
      return Response.json(
        {
          sucesso: false,
          erro: "clienteId não informado",
        },
        { status: 400 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return Response.json(
        {
          sucesso: false,
          erro: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      return Response.json(
        {
          sucesso: false,
          erro: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        {
          sucesso: false,
          erro: "Usuário não autenticado.",
        },
        { status: 401 }
      );
    }

    const matches = await buscarMatches(clienteId, token);

    return Response.json({
      sucesso: true,
      clienteId,
      matches,
    });
  } catch (error) {
    console.error("Erro no Match:", error);

    return Response.json(
      {
        sucesso: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
