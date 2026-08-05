"use client";

import { useEffect, useState } from "react";

import Column from "./Column";

import { listarFunil } from "@/services/funil";

export default function Board() {
  const [dados, setDados] = useState<any[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const lista = await listarFunil();
    setDados(lista);
  }

  const status = [
    "Novo Lead",
    "Contato",
    "Visita",
    "Proposta",
    "Negociação",
    "Fechado",
  ];

  return (
    <div className="flex gap-6 overflow-auto">

      {status.map((item) => (

        <Column
          key={item}
          titulo={item}
          leads={dados.filter(
            (l) => l.status === item
          )}
        />

      ))}

    </div>
  );
}