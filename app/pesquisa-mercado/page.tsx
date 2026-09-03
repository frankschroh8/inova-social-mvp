"use client";

import { useMemo, useState } from "react";
import {
  avaliarImovelMercado,
  buscarImoveisPesquisaMercado,
  calcularResumoMercado,
  fontesMercadoDisponiveis,
  listarImoveisPesquisaMercado,
  type AvaliacaoMercado,
  type FiltrosPesquisaMercado,
  type ImovelPesquisaMercado,
  areaReferencia,
  valorPorM2,
} from "@/services/pesquisaMercado";

const filtrosIniciais: FiltrosPesquisaMercado = {
  finalidade: "",
  tipo: "",
  cidade: "",
  bairro: "",
  valorMin: "",
  valorMax: "",
  quartosMin: "",
  suitesMin: "",
  banheirosMin: "",
  vagasMin: "",
  areaMin: "",
};

export default function PesquisaMercadoPage() {
  const [filtros, setFiltros] =
    useState<FiltrosPesquisaMercado>(filtrosIniciais);
  const [imoveis, setImoveis] = useState<ImovelPesquisaMercado[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [imoveisAvaliacao, setImoveisAvaliacao] = useState<
    ImovelPesquisaMercado[]
  >([]);
  const [imovelAvaliadoId, setImovelAvaliadoId] = useState("");
  const [avaliacao, setAvaliacao] = useState<AvaliacaoMercado | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoAvaliacao, setCarregandoAvaliacao] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);

  const resumo = useMemo(
    () => calcularResumoMercado(imoveis),
    [imoveis]
  );

  const imoveisSelecionados = imoveis.filter((imovel) =>
    selecionados.includes(imovel.id)
  );

  function atualizarFiltro(
    campo: keyof FiltrosPesquisaMercado,
    valor: string
  ) {
    setFiltros((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparFiltros() {
    setFiltros(filtrosIniciais);
    setImoveis([]);
    setSelecionados([]);
    setPesquisou(false);
  }

  async function pesquisar() {
    setCarregando(true);

    try {
      const resultado = await buscarImoveisPesquisaMercado(filtros);

      setImoveis(resultado);
      setSelecionados([]);
      setPesquisou(true);
    } catch (error) {
      console.error("Erro na pesquisa de mercado:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao pesquisar imóveis."
      );
    } finally {
      setCarregando(false);
    }
  }

  function alternarSelecionado(imovelId: string) {
    setSelecionados((atuais) =>
      atuais.includes(imovelId)
        ? atuais.filter((id) => id !== imovelId)
        : [...atuais, imovelId]
    );
  }

  async function carregarImoveisAvaliacao() {
    if (imoveisAvaliacao.length > 0) return;

    try {
      const resultado = await listarImoveisPesquisaMercado();
      setImoveisAvaliacao(resultado);
    } catch (error) {
      console.error("Erro ao carregar imóveis para avaliação:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar imóveis para avaliação."
      );
    }
  }

  async function avaliarImovel() {
    if (!imovelAvaliadoId) {
      alert("Selecione um imóvel para avaliar.");
      return;
    }

    setCarregandoAvaliacao(true);

    try {
      const resultado = await avaliarImovelMercado(imovelAvaliadoId);
      setAvaliacao(resultado);
    } catch (error) {
      console.error("Erro ao avaliar imóvel:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao avaliar imóvel."
      );
    } finally {
      setCarregandoAvaliacao(false);
    }
  }

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <header>
        <h1 style={{ marginBottom: 6 }}>Pesquisa de Mercado</h1>
        <p style={{ color: "#6b7280", marginTop: 0 }}>
          Compare imóveis cadastrados no CRM e analise referências de preço.
        </p>
      </header>

      <section
        style={{
          marginTop: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Fontes da pesquisa</h2>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {fontesMercadoDisponiveis.map((fonte) => (
            <label
              key={fonte.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "10px 12px",
                fontWeight: 700,
              }}
            >
              <input type="checkbox" checked readOnly />
              {fonte.nome}
            </label>
          ))}

          {[
            "Órulo — não configurado",
            "OLX/ZAP/Viva Real — não configurado",
            "QuintoAndar — não configurado",
          ].map((fonte) => (
            <span
              key={fonte}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#6b7280",
                background: "#f9fafb",
                fontWeight: 600,
              }}
            >
              {fonte}
            </span>
          ))}
        </div>
      </section>

      <section
        style={{
          marginTop: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Avaliar imóvel</h2>
        <p style={{ color: "#6b7280", marginTop: 0 }}>
          Gere uma estimativa indicativa usando comparáveis da base interna.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(240px, 1fr) auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <CampoSelect
            label="Imóvel"
            value={imovelAvaliadoId}
            onFocus={carregarImoveisAvaliacao}
            onChange={(valor) => setImovelAvaliadoId(valor)}
            opcoes={[
              ["", "Selecione um imóvel"],
              ...imoveisAvaliacao.map((imovel) => [
                imovel.id,
                `${imovel.titulo}${
                  imovel.bairro ? ` - ${imovel.bairro}` : ""
                }`,
              ]),
            ]}
          />

          <button
            type="button"
            onClick={avaliarImovel}
            disabled={carregandoAvaliacao}
            style={botaoPrimario}
          >
            {carregandoAvaliacao ? "Avaliando..." : "Avaliar imóvel"}
          </button>
        </div>

        {imoveisAvaliacao.length === 0 && (
          <button
            type="button"
            onClick={carregarImoveisAvaliacao}
            style={{ ...botaoSecundario, marginTop: 12 }}
          >
            Carregar imóveis
          </button>
        )}

        {avaliacao && <ResultadoAvaliacao avaliacao={avaliacao} />}
      </section>

      <section
        style={{
          marginTop: 24,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Filtros</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
          }}
        >
          <CampoSelect
            label="Finalidade"
            value={filtros.finalidade}
            onChange={(valor) => atualizarFiltro("finalidade", valor)}
            opcoes={[
              ["", "Todas"],
              ["venda", "Venda"],
              ["locacao", "Locação"],
            ]}
          />

          <CampoSelect
            label="Tipo de imóvel"
            value={filtros.tipo}
            onChange={(valor) => atualizarFiltro("tipo", valor)}
            opcoes={[
              ["", "Todos"],
              ["apartamento", "Apartamento"],
              ["casa", "Casa"],
              ["sobrado", "Sobrado"],
              ["terreno", "Terreno"],
              ["comercial", "Comercial"],
              ["studio", "Studio"],
              ["outro", "Outro"],
            ]}
          />

          <CampoTexto
            label="Cidade"
            value={filtros.cidade}
            onChange={(valor) => atualizarFiltro("cidade", valor)}
          />

          <CampoTexto
            label="Bairro"
            value={filtros.bairro}
            onChange={(valor) => atualizarFiltro("bairro", valor)}
          />

          <CampoTexto
            label="Valor mínimo"
            type="number"
            value={filtros.valorMin}
            onChange={(valor) => atualizarFiltro("valorMin", valor)}
          />

          <CampoTexto
            label="Valor máximo"
            type="number"
            value={filtros.valorMax}
            onChange={(valor) => atualizarFiltro("valorMax", valor)}
          />

          <CampoTexto
            label="Quartos mínimos"
            type="number"
            value={filtros.quartosMin}
            onChange={(valor) => atualizarFiltro("quartosMin", valor)}
          />

          <CampoTexto
            label="Suítes mínimas"
            type="number"
            value={filtros.suitesMin}
            onChange={(valor) => atualizarFiltro("suitesMin", valor)}
          />

          <CampoTexto
            label="Banheiros mínimos"
            type="number"
            value={filtros.banheirosMin}
            onChange={(valor) => atualizarFiltro("banheirosMin", valor)}
          />

          <CampoTexto
            label="Vagas mínimas"
            type="number"
            value={filtros.vagasMin}
            onChange={(valor) => atualizarFiltro("vagasMin", valor)}
          />

          <CampoTexto
            label="Área mínima"
            type="number"
            value={filtros.areaMin}
            onChange={(valor) => atualizarFiltro("areaMin", valor)}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={pesquisar}
            disabled={carregando}
            style={botaoPrimario}
          >
            {carregando ? "Pesquisando..." : "Pesquisar"}
          </button>

          <button
            type="button"
            onClick={limparFiltros}
            disabled={carregando}
            style={botaoSecundario}
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
        }}
      >
        <Indicador titulo="Imóveis" valor={String(resumo.quantidade)} />
        <Indicador titulo="Preço médio" valor={formatarMoeda(resumo.precoMedio)} />
        <Indicador
          titulo="Faixa de preços"
          valor={
            resumo.menorPreco !== null && resumo.maiorPreco !== null
              ? `${formatarMoeda(resumo.menorPreco)} a ${formatarMoeda(
                  resumo.maiorPreco
                )}`
              : "Sem dados"
          }
        />
        <Indicador
          titulo="Preço médio/m²"
          valor={formatarM2(resumo.precoMedioM2)}
        />
        <Indicador
          titulo="Menor preço/m²"
          valor={formatarM2(resumo.menorPrecoM2)}
        />
        <Indicador
          titulo="Maior preço/m²"
          valor={formatarM2(resumo.maiorPrecoM2)}
        />
      </section>

      {imoveisSelecionados.length >= 2 && (
        <Comparacao imoveis={imoveisSelecionados} />
      )}

      <section style={{ marginTop: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>Lista de imóveis</h2>

          {selecionados.length > 0 && (
            <span style={{ color: "#4b5563", fontSize: 14 }}>
              {selecionados.length} selecionado(s) para comparação
            </span>
          )}
        </div>

        {!pesquisou && (
          <p style={{ color: "#6b7280" }}>
            Use os filtros para pesquisar imóveis cadastrados no CRM.
          </p>
        )}

        {pesquisou && imoveis.length === 0 && (
          <p style={{ color: "#6b7280" }}>
            Nenhum imóvel encontrado para os filtros informados.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {imoveis.map((imovel) => (
            <CardImovel
              key={imovel.id}
              imovel={imovel}
              selecionado={selecionados.includes(imovel.id)}
              onSelecionar={() => alternarSelecionado(imovel.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function CardImovel({
  imovel,
  selecionado,
  onSelecionar,
}: {
  imovel: ImovelPesquisaMercado;
  selecionado: boolean;
  onSelecionar: () => void;
}) {
  const area = areaReferencia(imovel);
  const precoM2 = valorPorM2(imovel);

  return (
    <article
      style={{
        border: selecionado ? "2px solid #2563eb" : "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {imovel.foto && (
        <img
          src={imovel.foto}
          alt={imovel.titulo}
          style={{
            width: "100%",
            height: 190,
            objectFit: "cover",
            display: "block",
          }}
        />
      )}

      <div style={{ padding: 16 }}>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            color: "#4b5563",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={selecionado}
            onChange={onSelecionar}
          />
          Comparar
        </label>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "flex-start",
            marginTop: 10,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>{imovel.titulo}</h3>

          {imovel.destaque && (
            <span
              style={{
                background: "#fef3c7",
                color: "#92400e",
                borderRadius: 20,
                padding: "5px 9px",
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              Destaque
            </span>
          )}
        </div>

        {imovel.codigo && (
          <div style={{ color: "#6b7280", marginTop: 5 }}>
            Código: {imovel.codigo}
          </div>
        )}

        <div style={{ color: "#4b5563", marginTop: 10 }}>
          {[formatarTexto(imovel.tipo), formatarFinalidade(imovel.finalidade)]
            .filter(Boolean)
            .join(" • ")}
        </div>

        <div style={{ color: "#4b5563", marginTop: 6 }}>
          {[imovel.bairro, imovel.cidade].filter(Boolean).join(" • ")}
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>
          {formatarMoeda(imovel.valor)}
        </div>

        {precoM2 !== null && (
          <div style={{ color: "#6b7280", marginTop: 4 }}>
            {formatarM2(precoM2)}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 14,
          }}
        >
          <Tag valor={imovel.quartos} sufixo="quartos" />
          <Tag valor={imovel.suites} sufixo="suítes" />
          <Tag valor={imovel.banheiros} sufixo="banheiros" />
          <Tag valor={imovel.vagas} sufixo="vagas" />
          <Tag valor={area} sufixo="m²" />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 14,
            color: "#4b5563",
            fontSize: 14,
          }}
        >
          <span>Condomínio: {formatarMoeda(imovel.condominio)}</span>
          <span>IPTU: {formatarMoeda(imovel.iptu)}</span>
        </div>

        {(imovel.quintoandar || imovel.orulo) && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            {imovel.quintoandar && (
              <a href={imovel.quintoandar} target="_blank" rel="noreferrer" style={linkBotao}>
                QuintoAndar
              </a>
            )}

            {imovel.orulo && (
              <a href={imovel.orulo} target="_blank" rel="noreferrer" style={linkBotaoEscuro}>
                Órulo
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ResultadoAvaliacao({
  avaliacao,
}: {
  avaliacao: AvaliacaoMercado;
}) {
  const area = areaReferencia(avaliacao.imovel);
  const podeEstimar =
    avaliacao.estimativa !== null &&
    avaliacao.faixaMinima !== null &&
    avaliacao.faixaMaxima !== null;

  return (
    <div
      style={{
        marginTop: 20,
        borderTop: "1px solid #e5e7eb",
        paddingTop: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>
            Estimativa indicativa de mercado
          </h3>
          <p style={{ color: "#6b7280", marginTop: 6 }}>
            {avaliacao.imovel.titulo}
          </p>
        </div>

        <span
          style={{
            borderRadius: 20,
            padding: "7px 11px",
            background:
              avaliacao.qualidade === "Amostra forte"
                ? "#dcfce7"
                : avaliacao.qualidade === "Amostra moderada"
                  ? "#fef3c7"
                  : "#f3f4f6",
            color:
              avaliacao.qualidade === "Amostra forte"
                ? "#166534"
                : avaliacao.qualidade === "Amostra moderada"
                  ? "#92400e"
                  : "#374151",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          {avaliacao.qualidade}
        </span>
      </div>

      <p style={{ color: "#4b5563" }}>
        {avaliacao.observacao}
        {avaliacao.amostraAmpliada ? " A amostra foi ampliada." : ""}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        <Indicador
          titulo="Comparáveis"
          valor={String(avaliacao.resumo.quantidade)}
        />
        <Indicador
          titulo="Preço médio"
          valor={formatarMoeda(avaliacao.resumo.precoMedio)}
        />
        <Indicador
          titulo="Preço médio/m²"
          valor={formatarM2(avaliacao.resumo.precoMedioM2)}
        />
        <Indicador titulo="Área avaliada" valor={formatarArea(area)} />
        <Indicador
          titulo="Estimativa indicativa"
          valor={formatarMoeda(avaliacao.estimativa)}
        />
        <Indicador
          titulo="Faixa indicativa"
          valor={
            podeEstimar
              ? `${formatarMoeda(avaliacao.faixaMinima)} a ${formatarMoeda(
                  avaliacao.faixaMaxima
                )}`
              : "Sem dados"
            }
        />
      </div>

      <a
        href={`/pesquisa-mercado/relatorio?imovelId=${avaliacao.imovel.id}`}
        target="_blank"
        rel="noreferrer"
        style={{
          ...botaoPrimario,
          display: "inline-block",
          marginTop: 16,
          textDecoration: "none",
        }}
      >
        Gerar relatório
      </a>

      {!podeEstimar && (
        <p style={{ color: "#92400e", marginTop: 14 }}>
          Dados insuficientes para estimativa por m². É necessário que o imóvel
          avaliado tenha área válida e que os comparáveis tenham valor e área.
        </p>
      )}

      {avaliacao.comparaveis.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h3>Comparáveis usados</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {avaliacao.comparaveis.map((comparavel) => (
              <ComparavelCard key={comparavel.id} imovel={comparavel} />
            ))}
          </div>
        </div>
      )}

      {avaliacao.comparaveis.length === 0 && (
        <p style={{ color: "#6b7280", marginTop: 14 }}>
          Não há imóveis comparáveis na base interna para este imóvel.
        </p>
      )}
    </div>
  );
}

function ComparavelCard({ imovel }: { imovel: ImovelPesquisaMercado }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 14,
        background: "#f9fafb",
      }}
    >
      <strong>{imovel.titulo}</strong>
      <div style={{ color: "#6b7280", marginTop: 5 }}>
        {imovel.bairro || "Bairro não informado"}
      </div>
      <div style={{ fontWeight: 800, marginTop: 8 }}>
        {formatarMoeda(imovel.valor)}
      </div>
      <div style={{ color: "#4b5563", marginTop: 4 }}>
        {formatarArea(areaReferencia(imovel))} • {formatarM2(valorPorM2(imovel))}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginTop: 10,
        }}
      >
        <Tag valor={imovel.quartos} sufixo="quartos" />
        <Tag valor={imovel.suites} sufixo="suítes" />
        <Tag valor={imovel.vagas} sufixo="vagas" />
      </div>
    </div>
  );
}

function Comparacao({ imoveis }: { imoveis: ImovelPesquisaMercado[] }) {
  return (
    <section
      style={{
        marginTop: 24,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Comparação</h2>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 760,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={celulaCabecalho}>Imóvel</th>
              {imoveis.map((imovel) => (
                <th key={imovel.id} style={celulaCabecalho}>
                  {imovel.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Valor", (imovel: ImovelPesquisaMercado) => formatarMoeda(imovel.valor)],
              ["Valor/m²", (imovel: ImovelPesquisaMercado) => formatarM2(valorPorM2(imovel))],
              ["Área", (imovel: ImovelPesquisaMercado) => formatarArea(areaReferencia(imovel))],
              ["Quartos", (imovel: ImovelPesquisaMercado) => formatarNumero(imovel.quartos)],
              ["Suítes", (imovel: ImovelPesquisaMercado) => formatarNumero(imovel.suites)],
              ["Banheiros", (imovel: ImovelPesquisaMercado) => formatarNumero(imovel.banheiros)],
              ["Vagas", (imovel: ImovelPesquisaMercado) => formatarNumero(imovel.vagas)],
              ["Bairro", (imovel: ImovelPesquisaMercado) => imovel.bairro || "Sem dados"],
              ["Condomínio", (imovel: ImovelPesquisaMercado) => formatarMoeda(imovel.condominio)],
              ["IPTU", (imovel: ImovelPesquisaMercado) => formatarMoeda(imovel.iptu)],
            ].map(([label, obterValor]) => (
              <tr key={String(label)}>
                <td style={celulaTitulo}>{String(label)}</td>
                {imoveis.map((imovel) => (
                  <td key={imovel.id} style={celula}>
                    {(obterValor as (imovel: ImovelPesquisaMercado) => string)(imovel)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 13 }}>{titulo}</div>
      <strong style={{ display: "block", marginTop: 6, fontSize: 20 }}>
        {valor}
      </strong>
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <label style={{ display: "block", fontWeight: 600 }}>
      {label}
      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={campoEstilo}
      />
    </label>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  opcoes,
  onFocus,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  opcoes: string[][];
  onFocus?: () => void;
}) {
  return (
    <label style={{ display: "block", fontWeight: 600 }}>
      {label}
      <select
        value={value}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        style={campoEstilo}
      >
        {opcoes.map(([valor, rotulo]) => (
          <option key={valor} value={valor}>
            {rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}

function Tag({
  valor,
  sufixo,
}: {
  valor: number | null;
  sufixo: string;
}) {
  if (valor === null || valor === undefined) return null;

  return (
    <span
      style={{
        background: "#f3f4f6",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: "6px 10px",
        fontSize: 13,
        color: "#374151",
      }}
    >
      {valor} {sufixo}
    </span>
  );
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
  if (!valor) return "";

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}

function formatarFinalidade(valor: string | null) {
  if (valor === "venda") return "Venda";
  if (valor === "locacao") return "Locação";

  return valor || "";
}

const campoEstilo = {
  display: "block",
  width: "100%",
  padding: 10,
  marginTop: 6,
  border: "1px solid #d1d5db",
  borderRadius: 8,
} as const;

const botaoPrimario = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const botaoSecundario = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const linkBotao = {
  padding: "9px 12px",
  borderRadius: 8,
  background: "#2563eb",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 14,
} as const;

const linkBotaoEscuro = {
  ...linkBotao,
  background: "#111827",
} as const;

const celulaCabecalho = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
  verticalAlign: "top",
} as const;

const celulaTitulo = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 700,
  color: "#374151",
  background: "#fff",
} as const;

const celula = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
  verticalAlign: "top",
} as const;
