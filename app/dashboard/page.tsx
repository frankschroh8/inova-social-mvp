"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/cards/MetricCard";
import { getDashboardData } from "@/services/dashboard";

export default function Dashboard() {
  const [dados, setDados] = useState({
    clientes: 0,
    imoveis: 0,
    visitas: 0,
  });

  useEffect(() => {
    async function carregar() {
      const dashboard = await getDashboardData();
      setDados(dashboard);
    }

    carregar();
  }, []);

  return (
    <main className="p-8">

      <h1 className="mb-8 text-3xl font-bold">
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-3">

        <MetricCard
          titulo="Clientes"
          valor={dados.clientes}
        />

        <MetricCard
          titulo="Imóveis"
          valor={dados.imoveis}
        />

        <MetricCard
          titulo="Visitas"
          valor={dados.visitas}
        />

      </div>

    </main>
  );
}