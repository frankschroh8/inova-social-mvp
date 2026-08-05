"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/analytics";

export function useDashboard() {
  const [stats, setStats] = useState<any>();

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const dados = await getDashboardStats();
    setStats(dados);
  }

  return stats;
}