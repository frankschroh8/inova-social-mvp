"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { registrarContatoCliente } from "@/services/contatos";
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

export default function PosVendaPage() {
  const [itens, setItens] = useState<PosVendaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [clienteContato, setClienteContato] = useState<PosVendaItem | null>(
    null
  );
  const [descricaoContato, setDescricaoContato] = useState("");
  const [proximoContato, setProximoContato] = useState("");
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [erroContato, setErroContato] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarPosVenda() {
    setCarregando(true);

    try {
      setErroCarregamento("");
      setItens(await listarPosVenda());
    } catch (error) {
      setErroCarregamento(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o pós-venda."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarPosVenda();
  }, []);

  function abrirFormularioContato(item: PosVendaItem) {
    setClienteContato(item);
    setDescricaoContato("");
    setProximoContato("");
    setErroContato("");
    setMensagem("");
  }

  function fecharFormularioContato() {
    if (salvandoContato) return;

    setClienteContato(null);
    setDescricaoContato("");
    setProximoContato("");
    setErroContato("");
  }

  async function salvarContato() {
    if (!clienteContato) return;

    if (!descricaoContato.trim()) {
      setErroContato("Digite uma observação sobre o contato.");
      return;
    }

    setSalvandoContato(true);
    setErroContato("");
    setMensagem("");

    try {
      await registrarContatoCliente({
        clienteId: clienteContato.clienteId,
        descricao: descricaoContato,
        proximoContato,
      });

      setClienteContato(null);
      setDescricaoContato("");
      setProximoContato("");
      setMensagem("Contato registrado com sucesso.");
      await carregarPosVenda();
    } catch (error) {
      setErroContato(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o contato."
      );
    } finally {
      setSalvandoContato(false);
    }
  }

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
          ) : erroCarregamento ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {erroCarregamento}
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
                const whatsapp = linkWhatsApp(item.telefone);

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

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirFormularioContato(item)}
                        className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        Registrar contato
                      </button>

                      <Link
                        href={`/clientes/${item.clienteId}`}
                        className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-400"
                      >
                        Abrir cliente
                      </Link>

                      {whatsapp ? (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {mensagem ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {mensagem}
        </div>
      ) : null}

      {clienteContato ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase text-gray-500">
                Registrar contato
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-950">
                {clienteContato.nome}
              </h2>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">
                Descrição do contato
              </span>
              <textarea
                value={descricaoContato}
                onChange={(event) =>
                  setDescricaoContato(event.target.value)
                }
                placeholder="Conversei com o cliente após o fechamento."
                className="mt-2 min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-gray-700">
                Próximo contato
              </span>
              <input
                type="datetime-local"
                value={proximoContato}
                onChange={(event) => setProximoContato(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10"
              />
            </label>

            {erroContato ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {erroContato}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharFormularioContato}
                disabled={salvandoContato}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarContato}
                disabled={salvandoContato}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoContato ? "Salvando..." : "Salvar contato"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
