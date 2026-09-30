"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listarPosVenda, type PosVendaItem } from "@/services/posVenda";

function formatarMoeda(valor: number | string | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);

  if (!Number.isFinite(numero)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(numero);
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Não definido";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) return "Não definido";

  return valor.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rotuloFinalidade(finalidade: string | null | undefined) {
  if (finalidade === "venda") return "Venda";
  if (finalidade === "locacao") return "Locação";

  return "Não informada";
}

function quantidadeNegocios(item: PosVendaItem) {
  return item.quantidadeNegocios === 1
    ? "1 negócio fechado"
    : `${item.quantidadeNegocios} negócios fechados`;
}

export default function PosVendaPage() {
  const [itens, setItens] = useState<PosVendaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setErro("");
        setItens(await listarPosVenda());
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o pós-venda."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  const indicadores = useMemo(() => {
    const estruturados = itens.filter(
      (item) => item.tipo === "estruturado"
    );

    return {
      total: itens.length,
      vendas: estruturados.filter(
        (item) => item.ultimoNegocio?.finalidade === "venda"
      ).length,
      locacoes: estruturados.filter(
        (item) => item.ultimoNegocio?.finalidade === "locacao"
      ).length,
      legados: itens.filter((item) => item.tipo === "legado").length,
    };
  }, [itens]);

  return (
    <main className="bg-gray-50 p-6 md:p-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-950">Pós-venda</h1>
          <p className="mt-3 text-base text-gray-600">
            Relacionamento com clientes após o fechamento.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Clientes em pós-venda", indicadores.total],
            ["Vendas", indicadores.vendas],
            ["Locações", indicadores.locacoes],
            ["Fechamentos legados", indicadores.legados],
          ].map(([titulo, valor]) => (
            <div
              key={titulo}
              className="rounded-lg border bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-600">{titulo}</p>
              <strong className="mt-2 block text-3xl text-gray-950">
                {valor}
              </strong>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-950">
              Clientes em pós-venda
            </h2>
          </div>

          {carregando ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-gray-500">
              Carregando pós-venda...
            </div>
          ) : erro ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {erro}
            </div>
          ) : itens.length === 0 ? (
            <div className="rounded-lg border bg-white p-5 text-sm text-gray-500">
              Nenhum cliente em pós-venda.
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {itens.map((item) => {
                const negocio = item.ultimoNegocio;
                const valorFinal = formatarMoeda(negocio?.valorFinal);

                return (
                  <article
                    key={item.clienteId}
                    className="rounded-lg border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-950">
                          {item.nome}
                        </h3>
                        {item.telefone && (
                          <p className="mt-1 text-sm text-gray-600">
                            {item.telefone}
                          </p>
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          item.tipo === "estruturado"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-gray-100 text-gray-700 ring-gray-200"
                        }`}
                      >
                        {item.tipo === "estruturado"
                          ? "Pós-venda estruturado"
                          : "Fechamento legado"}
                      </span>
                    </div>

                    {negocio ? (
                      <div className="mt-5 border-t pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-semibold text-gray-900">
                            Último negócio
                          </h4>
                          <span className="text-xs font-medium text-gray-500">
                            {quantidadeNegocios(item)}
                          </span>
                        </div>

                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-gray-500">Imóvel</dt>
                            <dd className="mt-1 font-medium text-gray-900">
                              {negocio.imovelTitulo || "Não informado"}
                              {negocio.imovelCodigo
                                ? ` • ${negocio.imovelCodigo}`
                                : ""}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Finalidade</dt>
                            <dd className="mt-1 font-medium text-gray-900">
                              {rotuloFinalidade(negocio.finalidade)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Valor final</dt>
                            <dd className="mt-1 font-medium text-gray-900">
                              {valorFinal || "Não informado"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Fechamento</dt>
                            <dd className="mt-1 font-medium text-gray-900">
                              {formatarData(negocio.dataFechamento)}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-gray-500">
                              Tempo desde o fechamento
                            </dt>
                            <dd className="mt-1 font-medium text-gray-900">
                              {item.diasDesdeFechamento === null
                                ? "Não definido"
                                : `${item.diasDesdeFechamento} dias`}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                        Sem negócio estruturado
                      </div>
                    )}

                    <dl className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-gray-500">Último contato</dt>
                        <dd className="mt-1 font-medium text-gray-900">
                          {formatarData(item.ultimoContato)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Próximo contato</dt>
                        <dd className="mt-1 font-medium text-gray-900">
                          {formatarData(item.proximoContato)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex justify-end">
                      <Link
                        href={`/clientes/${item.clienteId}`}
                        className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-400"
                      >
                        Abrir cliente
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
