"use client";

interface Props {
  lead: any;
}

function formatarValor(valor: number | null | undefined) {
  if (valor === null || valor === undefined) {
    return "Não informado";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatarFinalidade(finalidade: string | null | undefined) {
  if (!finalidade) return "Não informada";

  if (finalidade === "venda") return "Compra";
  if (finalidade === "locacao") return "Locação";

  return finalidade;
}

function formatarData(data: string | null | undefined) {
  if (!data) return null;

  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LeadCard({ lead }: Props) {
  const ultimaAtividadeEm = formatarData(lead.ultimaAtividadeEm);

  return (
    <a
      href={`/clientes/${lead.id}`}
      className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-gray-400 hover:shadow-md"
    >

      <h3 className="font-semibold text-gray-950">
        {lead.nome}
      </h3>

      {lead.telefone && (
        <p className="mt-1 text-sm text-gray-500">
          {lead.telefone}
        </p>
      )}

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-medium">Interesse:</span>{" "}
          {lead.interesse || "Não informado"}
        </p>

        <p>
          <span className="font-medium">Finalidade:</span>{" "}
          {formatarFinalidade(lead.finalidade)}
        </p>

        <p>
          <span className="font-medium">Bairro:</span>{" "}
          {lead.bairro || "Não informado"}
        </p>

        <p>
          <span className="font-medium">Valor máximo:</span>{" "}
          {formatarValor(lead.valor)}
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        <strong>{lead.quantidadeMatches || 0}</strong>{" "}
        {(lead.quantidadeMatches || 0) === 1
          ? "imóvel compatível"
          : "imóveis compatíveis"}
      </div>

      <div className="mt-3 border-t pt-3 text-xs text-gray-500">
        <p className="font-medium text-gray-600">
          Última atividade
        </p>

        <p className="mt-1 line-clamp-2">
          {lead.ultimaAtividade || "Sem atividade registrada"}
        </p>

        {ultimaAtividadeEm && (
          <p className="mt-1">{ultimaAtividadeEm}</p>
        )}
      </div>

    </a>
  );
}
