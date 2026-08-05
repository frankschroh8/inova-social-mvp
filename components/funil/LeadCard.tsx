"use client";

interface Props {
  lead: any;
}

export default function LeadCard({ lead }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">

      <h3 className="font-semibold">
        {lead.clientes?.nome}
      </h3>

      <p className="text-sm text-gray-500">
        {lead.clientes?.telefone}
      </p>

    </div>
  );
}