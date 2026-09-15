"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  listarAtendimento,
  type AtendimentoItem,
  type PrioridadeAtendimento,
} from "@/services/atendimento";
import type { EtapaFunil } from "@/services/funil";

type EtapaFiltro = Exclude<EtapaFunil, "Fechado"> | "Todas";
type PrioridadeFiltro = PrioridadeAtendimento | "Todas";

const etapasFiltro: EtapaFiltro[] = [
  "Todas",
  "Novo",
  "Em atendimento",
  "Interessado",
  "Visita agendada",
  "Proposta",
];

const prioridadesFiltro: PrioridadeFiltro[] = [
  "Todas",
  "Alta",
  "Média",
  "Normal",
];

function normalizarBusca(texto: string | null | undefined) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Não definido";

  return new Date(data).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function classePrioridade(prioridade: PrioridadeAtendimento) {
  if (prioridade === "Alta") {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (prioridade === "Média") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function classeEtapa(etapa: EtapaFiltro) {
  if (etapa === "Proposta") return "bg-violet-50 text-violet-700";
  if (etapa === "Visita agendada") return "bg-sky-50 text-sky-700";
  if (etapa === "Interessado") return "bg-emerald-50 text-emerald-700";
  if (etapa === "Em atendimento") return "bg-orange-50 text-orange-700";

  return "bg-gray-100 text-gray-700";
}

function linkWhatsApp(telefone: string | null) {
  if (!telefone) return null;

  let numero = telefone.replace(/\D/g, "");

  if (numero.length === 10 || numero.length === 11) {
    numero = `55${numero}`;
  }

  if (!numero) return null;

  const mensagem = encodeURIComponent("Olá, tudo bem?");

  return `https://wa.me/${numero}?text=${mensagem}`;
}

function ResumoCard({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        destaque ? "border-red-200" : "border-gray-200"
      }`}
    >
      <p className="text-sm font-medium text-gray-500">{titulo}</p>
      <strong
        className={`mt-2 block text-3xl font-bold ${
          destaque ? "text-red-700" : "text-gray-950"
        }`}
      >
        {valor}
      </strong>
    </div>
  );
}

function AtendimentoCard({ item }: { item: AtendimentoItem }) {
  const whatsapp = linkWhatsApp(item.telefone);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-gray-950">
              {item.nome}
            </h2>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classeEtapa(
                item.etapa
              )}`}
            >
              {item.etapa}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classePrioridade(
                item.prioridade
              )}`}
            >
              {item.prioridade}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-600">{item.motivo}</p>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Último contato
              </dt>
              <dd className="mt-1 text-gray-800">
                {formatarData(item.ultimo_contato)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Próximo contato
              </dt>
              <dd className="mt-1 text-gray-800">
                {formatarData(item.proximo_contato)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Telefone
              </dt>
              <dd className="mt-1 text-gray-800">
                {item.telefone || "Não informado"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            href={`/clientes/${item.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Abrir cliente
          </Link>

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function AtendimentoPage() {
  const [itens, setItens] = useState<AtendimentoItem[]>([]);
  const [resumo, setResumo] = useState({
    atrasados: 0,
    hoje: 0,
    semProximoContato: 0,
    proximos7Dias: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState<EtapaFiltro>("Todas");
  const [prioridade, setPrioridade] =
    useState<PrioridadeFiltro>("Todas");

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await listarAtendimento();
        setResumo(dados.resumo);
        setItens(dados.itens);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const itensFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca);

    return itens.filter((item) => {
      const atendeBusca =
        !termo ||
        normalizarBusca(item.nome).includes(termo) ||
          normalizarBusca(item.telefone).includes(termo);
      const atendeEtapa = etapa === "Todas" || item.etapa === etapa;
      const atendePrioridade =
        prioridade === "Todas" || item.prioridade === prioridade;

      return atendeBusca && atendeEtapa && atendePrioridade;
    });
  }, [busca, etapa, itens, prioridade]);

  const semPendencias = !carregando && itens.length === 0;
  const filtrosSemResultado =
    !carregando && itens.length > 0 && itensFiltrados.length === 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1180px] bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Central operacional
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
          Atendimento
        </h1>
        <p className="mt-2 max-w-2xl text-base text-gray-600">
          Prioridades comerciais e próximos contatos.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Atrasados"
          valor={resumo.atrasados}
          destaque
        />
        <ResumoCard titulo="Hoje" valor={resumo.hoje} />
        <ResumoCard
          titulo="Sem próximo contato"
          valor={resumo.semProximoContato}
        />
        <ResumoCard
          titulo="Próximos 7 dias"
          valor={resumo.proximos7Dias}
        />
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px]">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Busca
            </span>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Nome ou telefone"
              className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Etapa
            </span>
            <select
              value={etapa}
              onChange={(event) =>
                setEtapa(event.target.value as EtapaFiltro)
              }
              className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
            >
              {etapasFiltro.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Prioridade
            </span>
            <select
              value={prioridade}
              onChange={(event) =>
                setPrioridade(event.target.value as PrioridadeFiltro)
              }
              className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
            >
              {prioridadesFiltro.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-950">
              Prioridades
            </h2>
            <p className="text-sm text-gray-500">
              Alta, média e normal, com atrasados mais antigos primeiro.
            </p>
          </div>

          {!carregando ? (
            <span className="text-sm font-medium text-gray-500">
              {itensFiltrados.length} cliente
              {itensFiltrados.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {carregando ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500 shadow-sm">
            Carregando atendimentos...
          </div>
        ) : null}

        {semPendencias ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500 shadow-sm">
            Nenhum atendimento pendente no momento.
          </div>
        ) : null}

        {filtrosSemResultado ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500 shadow-sm">
            Nenhum cliente encontrado com esses filtros.
          </div>
        ) : null}

        <div className="space-y-4">
          {itensFiltrados.map((item) => (
            <AtendimentoCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
