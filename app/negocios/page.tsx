"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listarNegocios, type NegocioListado } from "@/services/negocios";

type FinalidadeFiltro = "todas" | "venda" | "locacao";
type PeriodoFiltro =
  | "todos"
  | "mes_atual"
  | "mes_anterior"
  | "ano_atual"
  | "personalizado";

function formatarMoeda(valor: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Sem data";

  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function rotuloFinalidade(finalidade: string | null | undefined) {
  if (finalidade === "venda") return "Venda";
  if (finalidade === "locacao") return "Locação";

  return "Não informada";
}

function normalizarBusca(texto: string | null | undefined) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function chaveMesSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(data);
  const ano = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  return `${ano}-${mes}`;
}

function chaveDiaSaoPaulo(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const ano = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;
  const dia = partes.find((parte) => parte.type === "day")?.value;

  return `${ano}-${mes}-${dia}`;
}

function chaveAnoSaoPaulo(data: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(data);
}

function chaveMesAnterior(chaveMes: string) {
  const [anoTexto, mesTexto] = chaveMes.split("-");
  let ano = Number(anoTexto);
  let mes = Number(mesTexto) - 1;

  if (mes === 0) {
    mes = 12;
    ano -= 1;
  }

  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function intervaloPersonalizadoValido(
  periodo: PeriodoFiltro,
  dataInicial: string,
  dataFinal: string
) {
  if (periodo !== "personalizado") return true;
  if (!dataInicial || !dataFinal) return false;

  return dataInicial <= dataFinal;
}

function negocioEstaNoPeriodo(
  negocio: NegocioListado,
  periodo: PeriodoFiltro,
  dataInicial: string,
  dataFinal: string
) {
  if (periodo === "todos") return true;
  if (!negocio.data_fechamento) return false;

  const data = new Date(negocio.data_fechamento);

  if (periodo === "personalizado") {
    if (!intervaloPersonalizadoValido(periodo, dataInicial, dataFinal)) {
      return false;
    }

    const diaNegocio = chaveDiaSaoPaulo(data);

    return diaNegocio >= dataInicial && diaNegocio <= dataFinal;
  }

  const mesAtual = chaveMesSaoPaulo(new Date());
  const mesNegocio = chaveMesSaoPaulo(data);

  if (periodo === "mes_atual") {
    return mesNegocio === mesAtual;
  }

  if (periodo === "mes_anterior") {
    return mesNegocio === chaveMesAnterior(mesAtual);
  }

  return chaveAnoSaoPaulo(data) === chaveAnoSaoPaulo(new Date());
}

function textoProposta(negocio: NegocioListado) {
  if (!negocio.proposta_id) {
    return "Fechamento direto";
  }

  if (negocio.proposta?.status) {
    return `Proposta vinculada (${negocio.proposta.status})`;
  }

  return "Proposta vinculada";
}

function escaparCsv(valor: string | number | null | undefined) {
  const texto = String(valor ?? "");

  return `"${texto.replace(/"/g, '""')}"`;
}

function nomeArquivoCsv() {
  return `negocios-${chaveDiaSaoPaulo(new Date())}.csv`;
}

export default function NegociosPage() {
  const [negocios, setNegocios] = useState<NegocioListado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [finalidade, setFinalidade] =
    useState<FinalidadeFiltro>("todas");
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("todos");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const lista = await listarNegocios();
        setNegocios(lista);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const intervaloValido = intervaloPersonalizadoValido(
    periodo,
    dataInicial,
    dataFinal
  );
  const mensagemIntervalo =
    periodo === "personalizado" && !intervaloValido
      ? "Informe um intervalo válido. A data inicial não pode ser posterior à data final."
      : "";

  const negociosFiltrados = useMemo(() => {
    const termo = normalizarBusca(busca);

    return negocios.filter((negocio) => {
      const atendeBusca =
        !termo ||
        [
          negocio.cliente?.nome,
          negocio.imovel?.titulo,
          negocio.imovel?.codigo,
        ].some((valor) => normalizarBusca(valor).includes(termo));
      const atendeFinalidade =
        finalidade === "todas" || negocio.finalidade === finalidade;
      const atendePeriodo = negocioEstaNoPeriodo(
        negocio,
        periodo,
        dataInicial,
        dataFinal
      );

      return atendeBusca && atendeFinalidade && atendePeriodo;
    });
  }, [busca, dataFinal, dataInicial, finalidade, negocios, periodo]);

  const indicadores = useMemo(() => {
    const total = negociosFiltrados.length;
    const valorTotal = negociosFiltrados.reduce(
      (soma, negocio) => soma + Number(negocio.valor_final || 0),
      0
    );
    const vendas = negociosFiltrados.filter(
      (negocio) => negocio.finalidade === "venda"
    ).length;
    const locacoes = negociosFiltrados.filter(
      (negocio) => negocio.finalidade === "locacao"
    ).length;

    return {
      total,
      valorTotal,
      vendas,
      locacoes,
      ticketMedio: total > 0 ? Math.round(valorTotal / total) : 0,
    };
  }, [negociosFiltrados]);

  function exportarCsv() {
    if (!intervaloValido) {
      alert("Informe um intervalo válido antes de exportar.");
      return;
    }

    if (negociosFiltrados.length === 0) {
      alert("Nenhum negócio encontrado com os filtros atuais.");
      return;
    }

    const colunas = [
      "Data",
      "Cliente",
      "Telefone",
      "Código do imóvel",
      "Imóvel",
      "Bairro",
      "Cidade",
      "Finalidade",
      "Valor final",
      "Proposta",
      "Observações",
    ];
    const linhas = negociosFiltrados.map((negocio) => [
      formatarData(negocio.data_fechamento),
      negocio.cliente?.nome || "",
      negocio.cliente?.telefone || "",
      negocio.imovel?.codigo || "",
      negocio.imovel?.titulo || "",
      negocio.imovel?.bairro || "",
      negocio.imovel?.cidade || "",
      rotuloFinalidade(negocio.finalidade),
      formatarMoeda(negocio.valor_final),
      textoProposta(negocio),
      negocio.observacoes || "",
    ]);
    const csv = [colunas, ...linhas]
      .map((linha) => linha.map(escaparCsv).join(";"))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nomeArquivoCsv();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <main className="bg-gray-50 p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-950">
            Negócios
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
            Vendas e locações efetivamente fechadas.
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Total de negócios
            </p>
            <strong className="mt-2 block text-3xl text-gray-950">
              {indicadores.total}
            </strong>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Valor total fechado
            </p>
            <strong className="mt-2 block text-2xl text-gray-950">
              {formatarMoeda(indicadores.valorTotal)}
            </strong>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Vendas</p>
            <strong className="mt-2 block text-3xl text-gray-950">
              {indicadores.vendas}
            </strong>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">Locações</p>
            <strong className="mt-2 block text-3xl text-gray-950">
              {indicadores.locacoes}
            </strong>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
              Ticket médio
            </p>
            <strong className="mt-2 block text-2xl text-gray-950">
              {formatarMoeda(indicadores.ticketMedio)}
            </strong>
          </div>
        </section>

        <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                Filtros
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Refine a consulta e exporte os negócios encontrados.
              </p>
            </div>

            <button
              type="button"
              onClick={exportarCsv}
              disabled={!intervaloValido || negociosFiltrados.length === 0}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Exportar CSV
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Buscar
              </label>
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Cliente, imóvel ou código"
                className="mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Finalidade
              </label>
              <select
                value={finalidade}
                onChange={(event) =>
                  setFinalidade(event.target.value as FinalidadeFiltro)
                }
                className="mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-gray-500"
              >
                <option value="todas">Todas</option>
                <option value="venda">Venda</option>
                <option value="locacao">Locação</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Período
              </label>
              <select
                value={periodo}
                onChange={(event) =>
                  setPeriodo(event.target.value as PeriodoFiltro)
                }
                className="mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-gray-500"
              >
                <option value="todos">Todos</option>
                <option value="mes_atual">Este mês</option>
                <option value="mes_anterior">Mês anterior</option>
                <option value="ano_atual">Este ano</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
          </div>

          {periodo === "personalizado" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={dataInicial}
                  onChange={(event) => setDataInicial(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Data final
                </label>
                <input
                  type="date"
                  value={dataFinal}
                  onChange={(event) => setDataFinal(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-gray-500"
                />
              </div>
            </div>
          )}

          {mensagemIntervalo && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              {mensagemIntervalo}
            </p>
          )}
        </section>

        <section className="mt-8 rounded-xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-2xl font-semibold text-gray-950">
              Negócios fechados
            </h2>
          </div>

          {carregando ? (
            <p className="p-5 text-sm text-gray-500">
              Carregando negócios...
            </p>
          ) : negocios.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">
              Nenhum negócio fechado registrado ainda.
            </p>
          ) : negociosFiltrados.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">
              Nenhum negócio encontrado com esses filtros.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Data</th>
                      <th className="px-5 py-3 font-semibold">Cliente</th>
                      <th className="px-5 py-3 font-semibold">Imóvel</th>
                      <th className="px-5 py-3 font-semibold">
                        Finalidade
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Valor final
                      </th>
                      <th className="px-5 py-3 font-semibold">Proposta</th>
                      <th className="px-5 py-3 font-semibold"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {negociosFiltrados.map((negocio) => (
                      <tr key={negocio.id} className="border-t">
                        <td className="px-5 py-4 text-gray-700">
                          {formatarData(negocio.data_fechamento)}
                        </td>
                        <td className="px-5 py-4">
                          <strong className="block text-gray-950">
                            {negocio.cliente?.nome || "Cliente"}
                          </strong>
                          {negocio.cliente?.telefone && (
                            <span className="text-xs text-gray-500">
                              {negocio.cliente.telefone}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <strong className="block text-gray-950">
                            {negocio.imovel?.titulo || "Imóvel"}
                          </strong>
                          <span className="text-xs text-gray-500">
                            {negocio.imovel?.codigo
                              ? `Código ${negocio.imovel.codigo}`
                              : "Sem código"}
                            {negocio.imovel?.bairro
                              ? ` • ${negocio.imovel.bairro}`
                              : ""}
                            {negocio.imovel?.cidade
                              ? `, ${negocio.imovel.cidade}`
                              : ""}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {rotuloFinalidade(negocio.finalidade)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-950">
                          {formatarMoeda(negocio.valor_final)}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {textoProposta(negocio)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/clientes/${negocio.cliente_id}`}
                            className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-900 hover:border-gray-400"
                          >
                            Abrir cliente
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-5 lg:hidden">
                {negociosFiltrados.map((negocio) => (
                  <article
                    key={negocio.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500">
                          {formatarData(negocio.data_fechamento)}
                        </p>
                        <h3 className="mt-1 font-semibold text-gray-950">
                          {negocio.cliente?.nome || "Cliente"}
                        </h3>
                        {negocio.cliente?.telefone && (
                          <p className="mt-1 text-sm text-gray-500">
                            {negocio.cliente.telefone}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {rotuloFinalidade(negocio.finalidade)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Imóvel:</span>{" "}
                        {negocio.imovel?.titulo || "Imóvel"}
                      </p>
                      {negocio.imovel?.codigo && (
                        <p>
                          <span className="font-medium">Código:</span>{" "}
                          {negocio.imovel.codigo}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Valor final:</span>{" "}
                        {formatarMoeda(negocio.valor_final)}
                      </p>
                      <p>
                        <span className="font-medium">Proposta:</span>{" "}
                        {textoProposta(negocio)}
                      </p>
                    </div>

                    <Link
                      href={`/clientes/${negocio.cliente_id}`}
                      className="mt-4 inline-flex rounded-lg border px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-400"
                    >
                      Abrir cliente
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}