"use client";

import { useEffect, useState } from "react";
import { listarAgenda } from "@/services/agenda";

export function useAgenda() {
  const [agenda, setAgenda] = useState<any[]>([]);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const dados = await listarAgenda();
    setAgenda(dados);
  }

  return {
    agenda,
    atualizar: carregar,
  };
}