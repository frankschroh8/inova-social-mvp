"use client";

import { useEffect, useState } from "react";

import Column from "./Column";

import { listarFunil } from "@/services/funil";

const ETAPAS = [
  "Novo",
  "Em atendimento",
  "Interessado",
  "Visita agendada",
  "Proposta",
  "Fechado",
];

export default function Board() {
  const [dados, setDados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const lista = await listarFunil();
      setDados(lista);
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <div className="rounded-lg border bg-white p-6 text-gray-500">
        Carregando funil...
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">

      {ETAPAS.map((item) => (

        <Column
          key={item}
          titulo={item}
          leads={dados.filter(
            (lead) => lead.etapa === item
          )}
        />

      ))}

    </div>
  );
}
