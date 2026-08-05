"use client";

import { useAgenda } from "@/hooks/useAgenda";
import AgendaCard from "./AgendaCard";

export default function AgendaList() {

  const { agenda } = useAgenda();

  return (

    <div className="space-y-4">

      {agenda.map((item) => (

        <AgendaCard
          key={item.id}
          item={item}
        />

      ))}

    </div>

  );

}