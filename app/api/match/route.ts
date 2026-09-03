import { buscarMatches } from "@/services/match";

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

    const matches = await buscarMatches(clienteId);

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