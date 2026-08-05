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
    <div className="w-80 rounded-xl bg-gray-100 p-4">

      <h2 className="mb-4 text-lg font-bold">
        {titulo}
      </h2>

      <div className="space-y-3">

        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
          />
        ))}

      </div>

    </div>
  );
}