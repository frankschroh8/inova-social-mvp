"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/cards/MetricCard";
import { getDashboardData } from "@/services/dashboard";

export default function Dashboard() {
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const dashboard = await getDashboardData();
        setDados(dashboard);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  function formatarTaxa(valor: number | null) {
    return valor === null ? "Sem dados" : `${valor}%`;
  }

  function formatarData(data: string | null | undefined) {
    if (!data) return "Sem data";

    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function nomeCliente(item: any) {
    const clientes = item.clientes;

    if (Array.isArray(clientes)) {
      return clientes[0]?.nome || "Cliente";
    }

    return clientes?.nome || "Cliente";
  }

  if (carregando || !dados) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <h1 className="mb-8 text-3xl font-bold">
          Dashboard
        </h1>

        <div className="rounded-xl border bg-white p-6 text-gray-500 shadow-sm">
          Carregando painel...
        </div>
      </main>
    );
  }

  const indicadores = [
    ["Total de clientes", dados.indicadores.totalClientes],
    ["Novos", dados.indicadores.novos],
    ["Em atendimento", dados.indicadores.emAtendimento],
    ["Interessados", dados.indicadores.interessados],
    ["Visitas agendadas", dados.indicadores.visitasAgendadas],
    ["Propostas", dados.indicadores.propostas],
    ["Fechados", dados.indicadores.fechados],
    ["Imóveis disponíveis", dados.indicadores.imoveisDisponiveis],
    ["Matches ativos/salvos", dados.indicadores.matchesAtivos],
  ];

  const taxas = [
    [
      "Clientes com match",
      formatarTaxa(dados.taxas.clientesComMatch),
      "clientes com ao menos um imóvel compatível",
    ],
    [
      "Visita sobre ativos",
      formatarTaxa(dados.taxas.visitaSobreAtivos),
      "visitas agendadas sobre clientes em andamento",
    ],
    [
      "Proposta sobre visitas",
      formatarTaxa(dados.taxas.propostaSobreVisitas),
      "propostas em relação às visitas",
    ],
    [
      "Fechamento sobre propostas",
      formatarTaxa(dados.taxas.fechamentoSobrePropostas),
      "depende de clientes marcados como Fechado",
    ],
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-8">

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Visão gerencial do CRM com base no funil, agenda e histórico.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["/clientes", "Clientes"],
            ["/imoveis", "Imóveis"],
            ["/agenda", "Agenda"],
            ["/funil", "Funil"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:border-gray-400"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indicadores.map(([titulo, valor]) => (
          <MetricCard
            key={titulo}
            titulo={String(titulo)}
            valor={valor}
          />
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-4">
        {taxas.map(([titulo, valor, descricao]) => (
          <MetricCard
            key={titulo}
            titulo={String(titulo)}
            valor={String(valor)}
            descricao={String(descricao)}
          />
        ))}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-semibold">
            Atividades recentes
          </h2>

          <div className="mt-4 space-y-4">
            {dados.atividadesRecentes.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma atividade registrada.
              </p>
            ) : (
              dados.atividadesRecentes.map((item: any) => (
                <a
                  key={item.id}
                  href={`/clientes/${item.cliente_id}`}
                  className="block rounded-lg border p-4 hover:border-gray-400"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{nomeCliente(item)}</strong>

                    <span className="text-xs text-gray-500">
                      {formatarData(item.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-gray-600">
                    {item.tipo || "Histórico"}
                  </p>

                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {item.descricao || "Atividade registrada"}
                  </p>
                </a>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Próximas visitas
          </h2>

          <div className="mt-4 space-y-4">
            {dados.proximasVisitas.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma visita futura agendada.
              </p>
            ) : (
              dados.proximasVisitas.map((item: any) => (
                <a
                  key={item.id}
                  href={`/clientes/${item.cliente_id}`}
                  className="block rounded-lg border p-4 hover:border-gray-400"
                >
                  <strong>{item.titulo || "Visita"}</strong>

                  <p className="mt-1 text-sm text-gray-600">
                    {nomeCliente(item)}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatarData(item.data_inicio)}
                  </p>

                  {item.descricao && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                      {item.descricao}
                    </p>
                  )}
                </a>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Resumo do funil
          </h2>

          <a
            href="/funil"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Abrir Kanban
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {dados.resumoFunil.map((item: any) => (
            <div
              key={item.etapa}
              className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200"
            >
              <p className="text-sm font-medium text-gray-600">
                {item.etapa}
              </p>

              <strong className="mt-2 block text-2xl">
                {item.total}
              </strong>
            </div>
          ))}
        </div>
      </section>


    </main>
  );
}
