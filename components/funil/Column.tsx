"use client";

import LeadCard from "./LeadCard";

interface Props {
  titulo: string;
  leads: any[];
}

export default function Column({
  titulo,
  leads,
}: Props) {
  return (
    <section className="min-w-80 w-80 rounded-xl border bg-gray-50 p-4">

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900">
          {titulo}
        </h2>

        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
          {leads.length}
        </span>
      </div>

      <div className="space-y-3">

        {leads.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-white p-4 text-sm text-gray-500">
            Nenhum cliente nesta etapa.
          </p>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
            />
          ))
        )}

      </div>

    </section>
  );
}
