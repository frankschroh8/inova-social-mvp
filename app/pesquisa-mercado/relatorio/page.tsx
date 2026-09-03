"use client";

import { useEffect, useState } from "react";
import {
  avaliarImovelMercado,
  areaReferencia,
  valorPorM2,
  type AvaliacaoMercado,
  type ImovelPesquisaMercado,
} from "@/services/pesquisaMercado";

export default function RelatorioPesquisaMercadoPage() {
  const [avaliacao, setAvaliacao] = useState<AvaliacaoMercado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarRelatorio() {
      try {
        const parametros = new URLSearchParams(window.location.search);
        const imovelId = parametros.get("imovelId");

        if (!imovelId) {
          setErro("Imóvel não informado para o relatório.");
          return;
        }

        const resultado = await avaliarImovelMercado(imovelId);
        setAvaliacao(resultado);
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao gerar relatório."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarRelatorio();
  }, []);

  if (carregando) {
    return <main style={pagina}>Carregando relatório...</main>;
  }

  if (erro || !avaliacao) {
    return (
      <main style={pagina}>
        <h1>Análise Comparativa de Mercado</h1>
        <p>{erro || "Não foi possível gerar o relatório."}</p>
      </main>
    );
  }

  const area = areaReferencia(avaliacao.imovel);
  const faixaIndicativa =
    avaliacao.faixaMinima !== null && avaliacao.faixaMaxima !== null
      ? `${formatarMoeda(avaliacao.faixaMinima)} a ${formatarMoeda(
          avaliacao.faixaMaxima
        )}`
      : "Dados insuficientes";
  const dataAnalise = new Date().toLocaleString("pt-BR");

  return (
    <main style={pagina}>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: #fff !important;
            }

            main {
              padding: 0 !important;
              max-width: none !important;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `}
      </style>

      <div className="no-print" style={barraAcoes}>
        <a href="/pesquisa-mercado" style={botaoSecundario}>
          Voltar
        </a>

        <button type="button" onClick={() => window.print()} style={botaoPrimario}>
          Imprimir relatório
        </button>
      </div>

      <header style={cabecalho}>
        <div>
          <div style={marca}>Inova Social AI</div>
          <h1 style={{ margin: "6px 0 0" }}>
            Análise Comparativa de Mercado
          </h1>
          <p style={{ color: "#4b5563", marginBottom: 0 }}>
            Análise gerada em {dataAnalise}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <strong style={seloQualidade}>{avaliacao.qualidade}</strong>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 10 }}>
            {avaliacao.resumo.quantidade} comparável(is)
          </div>
        </div>
      </header>

      <section style={secao}>
        <h2>Identificação do imóvel</h2>

        <div style={grade}>
          <Campo titulo="Título" valor={avaliacao.imovel.titulo} />
          <Campo titulo="Código" valor={avaliacao.imovel.codigo || "Sem dados"} />
          <Campo titulo="Endereço" valor={formatarRua(avaliacao.imovel)} />
          <Campo titulo="Bairro" valor={avaliacao.imovel.bairro || "Sem dados"} />
          <Campo titulo="Cidade" valor={avaliacao.imovel.cidade || "Sem dados"} />
          <Campo titulo="Tipo" valor={formatarTexto(avaliacao.imovel.tipo)} />
          <Campo
            titulo="Finalidade"
            valor={formatarFinalidade(avaliacao.imovel.finalidade)}
          />
          <Campo titulo="Área" valor={formatarArea(area)} />
          <Campo titulo="Quartos" valor={formatarNumero(avaliacao.imovel.quartos)} />
          <Campo titulo="Suítes" valor={formatarNumero(avaliacao.imovel.suites)} />
          <Campo titulo="Vagas" valor={formatarNumero(avaliacao.imovel.vagas)} />
          <Campo
            titulo="Valor atual"
            valor={formatarMoeda(avaliacao.imovel.valor)}
          />
        </div>
      </section>

      <section style={secao}>
        <h2>Metodologia</h2>
        <p style={textoCorpo}>
          A estimativa é calculada a partir do preço médio por metro quadrado
          dos imóveis comparáveis selecionados pelo sistema, considerando
          similaridade de localização, finalidade, tipo e características
          disponíveis.
        </p>
      </section>

      <section style={secao}>
        <h2>Resultado da análise</h2>

        <div style={grade}>
          <Campo
            titulo="Estimativa indicativa de mercado"
            valor={formatarMoeda(avaliacao.estimativa)}
          />
          <Campo titulo="Faixa indicativa" valor={faixaIndicativa} />
          <Campo
            titulo="Preço médio/m²"
            valor={formatarM2(avaliacao.resumo.precoMedioM2)}
          />
          <Campo titulo="Qualidade da amostra" valor={avaliacao.qualidade} />
          <Campo
            titulo="Quantidade de comparáveis"
            valor={String(avaliacao.resumo.quantidade)}
          />
          <Campo
            titulo="Menor preço"
            valor={formatarMoeda(avaliacao.resumo.menorPreco)}
          />
          <Campo
            titulo="Maior preço"
            valor={formatarMoeda(avaliacao.resumo.maiorPreco)}
          />
          <Campo
            titulo="Preço médio"
            valor={formatarMoeda(avaliacao.resumo.precoMedio)}
          />
          <Campo
            titulo="Menor preço/m²"
            valor={formatarM2(avaliacao.resumo.menorPrecoM2)}
          />
          <Campo
            titulo="Maior preço/m²"
            valor={formatarM2(avaliacao.resumo.maiorPrecoM2)}
          />
        </div>

        <p style={{ color: "#4b5563" }}>{avaliacao.observacao}</p>
      </section>

      <section style={secao}>
        <h2>Comparáveis</h2>

        {avaliacao.comparaveis.length === 0 ? (
          <p>Não há imóveis comparáveis disponíveis para esta avaliação.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tabela}>
              <thead>
                <tr>
                  <th style={th}>Imóvel</th>
                  <th style={th}>Bairro</th>
                  <th style={th}>Área</th>
                  <th style={th}>Valor</th>
                  <th style={th}>Valor/m²</th>
                  <th style={th}>Quartos</th>
                  <th style={th}>Suítes</th>
                  <th style={th}>Vagas</th>
                </tr>
              </thead>
              <tbody>
                {avaliacao.comparaveis.map((imovel) => (
                  <tr key={imovel.id}>
                    <td style={td}>{imovel.titulo}</td>
                    <td style={td}>{imovel.bairro || "Sem dados"}</td>
                    <td style={td}>{formatarArea(areaReferencia(imovel))}</td>
                    <td style={td}>{formatarMoeda(imovel.valor)}</td>
                    <td style={td}>{formatarM2(valorPorM2(imovel))}</td>
                    <td style={td}>{formatarNumero(imovel.quartos)}</td>
                    <td style={td}>{formatarNumero(imovel.suites)}</td>
                    <td style={td}>{formatarNumero(imovel.vagas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={observacao}>
        Esta análise possui caráter indicativo e utiliza os imóveis disponíveis
        na base de dados do CRM. Não constitui laudo técnico de avaliação.
      </section>
    </main>
  );
}

function Campo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div style={campo}>
      <div style={{ color: "#6b7280", fontSize: 12 }}>{titulo}</div>
      <strong style={{ display: "block", marginTop: 4 }}>{valor}</strong>
    </div>
  );
}

function formatarRua(imovel: ImovelPesquisaMercado) {
  return [imovel.endereco, imovel.numero].filter(Boolean).join(", ") || "Sem dados";
}

function formatarMoeda(valor: number | null) {
  if (valor === null || valor === undefined || valor <= 0) {
    return "Sem dados";
  }

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function formatarM2(valor: number | null) {
  if (valor === null || valor === undefined || valor <= 0) {
    return "Sem dados";
  }

  return `${formatarMoeda(valor)}/m²`;
}

function formatarArea(valor: number | null) {
  return valor ? `${valor} m²` : "Sem dados";
}

function formatarNumero(valor: number | null) {
  return valor !== null && valor !== undefined ? String(valor) : "Sem dados";
}

function formatarTexto(valor: string | null) {
  if (!valor) return "Sem dados";

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function formatarFinalidade(valor: string | null) {
  if (valor === "venda") return "Venda";
  if (valor === "locacao") return "Locação";

  return valor || "Sem dados";
}

const pagina = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: 36,
  color: "#111827",
  background: "#fff",
} as const;

const barraAcoes = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 24,
} as const;

const cabecalho = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  border: "1px solid #d1d5db",
  borderTop: "5px solid #111827",
  borderRadius: 10,
  padding: 20,
  background: "#f9fafb",
} as const;

const secao = {
  marginTop: 28,
} as const;

const marca = {
  color: "#4b5563",
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0,
} as const;

const textoCorpo = {
  color: "#374151",
  lineHeight: 1.6,
  marginBottom: 0,
} as const;

const grade = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 12,
} as const;

const campo = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  background: "#f9fafb",
} as const;

const seloQualidade = {
  border: "1px solid #d1d5db",
  borderRadius: 20,
  padding: "8px 12px",
  whiteSpace: "nowrap",
} as const;

const observacao = {
  marginTop: 28,
  padding: 16,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  color: "#374151",
  background: "#f9fafb",
} as const;

const tabela = {
  width: "100%",
  minWidth: 760,
  borderCollapse: "collapse",
} as const;

const th = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #d1d5db",
  background: "#f3f4f6",
} as const;

const td = {
  padding: 10,
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
} as const;

const botaoPrimario = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const botaoSecundario = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  textDecoration: "none",
} as const;
