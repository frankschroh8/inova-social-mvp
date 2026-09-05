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

  function rotuloFollowUp(situacao: string) {
    if (situacao === "atrasado") return "Atrasado";
    if (situacao === "hoje") return "Hoje";
    return "Próximo";
  }

  function classeFollowUp(situacao: string) {
    if (situacao === "atrasado") {
      return "bg-red-50 text-red-700 ring-red-200";
    }

    if (situacao === "hoje") {
      return "bg-amber-50 text-amber-700 ring-amber-200";
    }

    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  if (carregando || !dados) {
    return (
      <main className="crm-dashboard-page bg-gray-50">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-gray-950">
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
    <main className="crm-dashboard-page bg-gray-50">

      <div className="mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">
            Dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
            Visão gerencial do CRM com base no funil, agenda e histórico.
          </p>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {indicadores.map(([titulo, valor]) => (
          <MetricCard
            key={titulo}
            titulo={String(titulo)}
            valor={valor}
          />
        ))}
      </section>

      <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {taxas.map(([titulo, valor, descricao]) => (
          <MetricCard
            key={titulo}
            titulo={String(titulo)}
            valor={String(valor)}
            descricao={String(descricao)}
          />
        ))}
      </section>

      <section className="mt-10 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-gray-950">
              Follow-ups
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Clientes com próximo contato pendente ou próximo.
            </p>
          </div>

          <a
            href="/clientes"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Ver clientes
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-red-50 p-5 ring-1 ring-red-200">
            <p className="text-sm font-semibold text-red-700">
              Atrasados
            </p>

            <strong className="mt-2 block text-3xl text-red-800">
              {dados.followUps.resumo.atrasados}
            </strong>
          </div>

          <div className="rounded-lg bg-amber-50 p-5 ring-1 ring-amber-200">
            <p className="text-sm font-semibold text-amber-700">
              Hoje
            </p>

            <strong className="mt-2 block text-3xl text-amber-800">
              {dados.followUps.resumo.hoje}
            </strong>
          </div>

          <div className="rounded-lg bg-blue-50 p-5 ring-1 ring-blue-200">
            <p className="text-sm font-semibold text-blue-700">
              Próximos 7 dias
            </p>

            <strong className="mt-2 block text-3xl text-blue-800">
              {dados.followUps.resumo.proximos}
            </strong>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-950">
            Contatos que precisam de atenção
          </h3>

          <div className="mt-3 space-y-3">
            {dados.followUps.itens.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                Nenhum follow-up pendente para hoje ou próximos 7 dias.
              </p>
            ) : (
              dados.followUps.itens.slice(0, 8).map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{item.nome}</strong>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classeFollowUp(
                          item.situacao
                        )}`}
                      >
                        {rotuloFollowUp(item.situacao)}
                      </span>
                    </div>

                    {item.telefone && (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.telefone}
                      </p>
                    )}

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatarData(item.proximo_contato)}
                    </p>
                  </div>

                  <a
                    href={`/clientes/${item.id}`}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-400"
                  >
                    Abrir cliente
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-2xl font-semibold text-gray-950">
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
          <h2 className="text-2xl font-semibold text-gray-950">
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

      <section className="mt-10 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-950">
            Resumo do funil
          </h2>

          <a
            href="/funil"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Abrir Kanban
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dados.resumoFunil.map((item: any) => (
            <div
              key={item.etapa}
              className="rounded-lg bg-gray-50 p-5 ring-1 ring-gray-200"
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
