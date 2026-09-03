"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  interesse: string | null;
  finalidade: string | null;
  bairro: string | null;
  cidade: string | null;
  valor: number | null;
  status: string | null;
}

interface Match {
  id: string;
  nome: string;
  score: number;
  pontosObtidos?: number;
  pontosPossiveis?: number;
  detalhesScore?: DetalheScore[];

  bairro: string | null;
  cidade: string | null;
  tipo: string | null;
  finalidade: string | null;

  valor: number | null;

  quartos: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  suites: number | null;

  foto: string | null;
  descricao: string | null;

  quintoandar: string | null;
  orulo: string | null;

  endereco: string | null;
  numero: string | null;

  codigo: string | null;
  destaque: boolean | null;
}

type StatusDetalheScore =
  | "atende"
  | "parcial"
  | "nao_atende"
  | "desconhecido";

interface DetalheScore {
  criterio: string;
  label: string;
  status: StatusDetalheScore;
  pontos: number;
  pontosPossiveis: number;
  descricao: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [matches, setMatches] = useState<Record<string, Match[]>>({});

  const [imoveisSelecionados, setImoveisSelecionados] = useState<
    Record<string, string[]>
  >({});

  const [carregandoMatch, setCarregandoMatch] = useState<string | null>(
    null
  );

  const [carregandoClientes, setCarregandoClientes] =
    useState<boolean>(true);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    setCarregandoClientes(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Usuário não está logado.");
        return;
      }

      const { data, error } = await supabase
        .from("clientes")
        .select(`
          id,
          nome,
          telefone,
          interesse,
          finalidade,
          bairro,
          cidade,
          valor,
          status
        `)
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar clientes:", error);
        alert("Erro ao carregar clientes.");
        return;
      }

      setClientes(data || []);
    } finally {
      setCarregandoClientes(false);
    }
  }

  async function encontrarImoveis(clienteId: string) {
    setCarregandoMatch(clienteId);

    try {
      const response = await fetch(
        `/api/match?clienteId=${clienteId}`
      );

      const resultado = await response.json();

      if (!response.ok || !resultado.sucesso) {
        throw new Error(
          resultado.erro || "Erro ao buscar imóveis."
        );
      }

      setMatches((anterior) => ({
        ...anterior,
        [clienteId]: resultado.matches || [],
      }));

      setImoveisSelecionados((anterior) => ({
        ...anterior,
        [clienteId]: [],
      }));
    } catch (error) {
      console.error("Erro no Match:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao encontrar imóveis."
      );
    } finally {
      setCarregandoMatch(null);
    }
  }

  function formatarFinalidade(finalidade: string | null) {
    if (!finalidade) return "";

    const valor = finalidade.toLowerCase();

    if (valor === "venda") return "Venda";

    if (valor === "locacao") return "Locação";

    if (valor === "aluguel") return "Locação";

    return finalidade;
  }

  function formatarTipo(tipo: string | null) {
    if (!tipo) return "";

    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  function formatarStatus(status: string | null) {
    if (!status) return "";

    return status;
  }

  function formatarValor(valor: number | null) {
    if (valor === null || valor === undefined) {
      return null;
    }

    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  }

  function corStatus(status: string | null) {
    switch (status) {
      case "Novo":
        return "#2563eb";

      case "Em atendimento":
        return "#d97706";

      case "Negociação":
        return "#7c3aed";

      case "Proposta":
        return "#0891b2";

      case "Cliente":
        return "#16a34a";

      case "Inativo":
        return "#6b7280";

      default:
        return "#6b7280";
    }
  }

  function corScore(score: number) {
    if (score >= 90) {
      return "#16a34a";
    }

    if (score >= 75) {
      return "#2563eb";
    }

    if (score >= 60) {
      return "#d97706";
    }

    return "#6b7280";
  }

  function scoreTexto(score: number) {
    if (score >= 90) {
      return "Excelente";
    }

    if (score >= 75) {
      return "Muito bom";
    }

    if (score >= 60) {
      return "Compatível";
    }

    return "Possível";
  }

  function diferencaOrcamento(
    valorImovel: number | null,
    valorCliente: number | null
  ) {
    if (
      valorImovel === null ||
      valorCliente === null ||
      valorImovel <= valorCliente
    ) {
      return null;
    }

    return valorImovel - valorCliente;
  }

  function alternarImovelSelecionado(clienteId: string, imovelId: string) {
    setImoveisSelecionados((anterior) => {
      const selecionados = anterior[clienteId] || [];
      const jaSelecionado = selecionados.includes(imovelId);

      return {
        ...anterior,
        [clienteId]: jaSelecionado
          ? selecionados.filter((id) => id !== imovelId)
          : [...selecionados, imovelId],
      };
    });
  }

  function resumoImovelHistorico(imovel: Match, index?: number) {
    const valor =
      imovel.valor !== null
        ? formatarValor(imovel.valor)
        : "Valor sob consulta";

    const prefixo =
      index === undefined ? "-" : `${index + 1}.`;

    return `${prefixo} ${imovel.nome} | Valor: ${valor} | Score: ${imovel.score}%`;
  }

  async function registrarHistoricoEnvioWhatsApp(
    clienteId: string,
    imoveis: Match[]
  ) {
    if (imoveis.length === 0) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error(
          "Não foi possível registrar histórico: usuário não está logado."
        );
        return;
      }

      const dataHora = new Date().toLocaleString("pt-BR");
      const descricao =
        imoveis.length === 1
          ? [
              `1 imóvel enviado pelo WhatsApp em ${dataHora}:`,
              resumoImovelHistorico(imoveis[0]),
            ].join("\n")
          : [
              `${imoveis.length} imóveis enviados pelo WhatsApp em ${dataHora}:`,
              ...imoveis.map((imovel, index) =>
                resumoImovelHistorico(imovel, index)
              ),
            ].join("\n");

      const { error } = await supabase.from("historico").insert({
        cliente_id: clienteId,
        usuario_id: user.id,
        tipo: "whatsapp",
        descricao,
      });

      if (error) {
        console.error(
          "Erro ao registrar envio no histórico:",
          error
        );
      }
    } catch (error) {
      console.error("Erro ao registrar envio no histórico:", error);
    }
  }

  function enviarWhatsApp(cliente: Cliente, imovel: Match) {
  if (!cliente.telefone) {
    alert("Este cliente não possui telefone cadastrado.");
    return;
  }

  let telefone = cliente.telefone.replace(/\D/g, "");

  // Adiciona código do Brasil quando necessário
  if (telefone.length === 10 || telefone.length === 11) {
    telefone = `55${telefone}`;
  }

  const valor = imovel.valor
    ? formatarValor(imovel.valor)
    : "Valor sob consulta";

  const localizacao = [imovel.bairro, imovel.cidade]
    .filter(Boolean)
    .join(" - ");

  const caracteristicas = [
    imovel.quartos !== null
      ? `${imovel.quartos} quartos`
      : null,

    imovel.suites !== null
      ? `${imovel.suites} suítes`
      : null,

    imovel.vagas !== null
      ? `${imovel.vagas} vagas`
      : null,

    imovel.area !== null
      ? `${imovel.area} m²`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const linkImovel =
    imovel.quintoandar ||
    imovel.orulo ||
    "";

  const mensagem = [
    `Olá ${cliente.nome}!`,
    "",
    "Encontrei um imóvel que pode combinar com o que você procura:",
    "",
    `🏠 ${imovel.nome}`,
    localizacao ? `📍 ${localizacao}` : "",
    valor ? `💰 ${valor}` : "",
    caracteristicas ? `📐 ${caracteristicas}` : "",
    "",
    `🎯 Compatibilidade: ${imovel.score}%`,
    linkImovel ? "" : "",
    linkImovel,
    "",
    "Se tiver interesse, posso te passar mais informações e verificar uma visita.",
  ]
    .filter((linha) => linha !== "")
    .join("\n");

  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(
    mensagem
  )}`;

  window.open(url, "_blank", "noopener,noreferrer");
  void registrarHistoricoEnvioWhatsApp(cliente.id, [imovel]);
}

  function enviarWhatsAppSelecionados(
    cliente: Cliente,
    imoveis: Match[]
  ) {
    if (!cliente.telefone) {
      alert("Este cliente não possui telefone cadastrado.");
      return;
    }

    if (imoveis.length === 0) {
      alert("Selecione pelo menos um imóvel para enviar.");
      return;
    }

    let telefone = cliente.telefone.replace(/\D/g, "");

    if (telefone.length === 10 || telefone.length === 11) {
      telefone = `55${telefone}`;
    }

    const blocosImoveis = imoveis.map((imovel, index) => {
      const valor =
        imovel.valor !== null
          ? formatarValor(imovel.valor)
          : "Valor sob consulta";

      const localizacao = [imovel.bairro, imovel.cidade]
        .filter(Boolean)
        .join(" - ");

      const caracteristicas = [
        imovel.quartos !== null
          ? `${imovel.quartos} quartos`
          : null,

        imovel.suites !== null
          ? `${imovel.suites} suítes`
          : null,

        imovel.banheiros !== null
          ? `${imovel.banheiros} banheiros`
          : null,

        imovel.vagas !== null
          ? `${imovel.vagas} vagas`
          : null,

        imovel.area !== null
          ? `${imovel.area} m²`
          : null,
      ]
        .filter(Boolean)
        .join(" • ");

      const linkImovel =
        imovel.quintoandar ||
        imovel.orulo ||
        "";

      return [
        `${index + 1}. ${imovel.nome}`,
        localizacao ? `📍 ${localizacao}` : "",
        valor ? `💰 ${valor}` : "",
        caracteristicas ? `📐 ${caracteristicas}` : "",
        `🎯 Compatibilidade: ${imovel.score}%`,
        linkImovel,
      ]
        .filter((linha) => linha !== "")
        .join("\n");
    });

    const mensagem = [
      `Olá ${cliente.nome}!`,
      "",
      `Separei ${imoveis.length} imóveis que podem combinar com o que você procura:`,
      "",
      blocosImoveis.join("\n\n"),
      "",
      "Se tiver interesse em algum deles, posso te passar mais informações e verificar uma visita.",
    ].join("\n");

    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(
      mensagem
  )}`;

    window.open(url, "_blank", "noopener,noreferrer");
    void registrarHistoricoEnvioWhatsApp(cliente.id, imoveis);
  }

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* CABEÇALHO */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
            }}
          >
            Clientes
          </h1>

          <p
            style={{
              marginTop: 8,
              color: "#666",
            }}
          >
            Gerencie seus clientes e encontre imóveis compatíveis.
          </p>
        </div>

        <a
          href="/clientes/novo"
          style={{
            display: "inline-block",
            padding: "12px 20px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          + Novo cliente
        </a>
      </div>

      <hr
        style={{
          margin: "30px 0",
          border: 0,
          borderTop: "1px solid #e5e7eb",
        }}
      />

      {/* LISTA */}

      <h2
        style={{
          marginBottom: 15,
        }}
      >
        Meus clientes
      </h2>

      {carregandoClientes && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "#666",
          }}
        >
          Carregando clientes...
        </div>
      )}

      {!carregandoClientes && clientes.length === 0 && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 10,
            padding: 30,
            textAlign: "center",
            background: "#fafafa",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#666",
            }}
          >
            Nenhum cliente cadastrado.
          </p>

          <a
            href="/clientes/novo"
            style={{
              display: "inline-block",
              marginTop: 15,
              color: "#2563eb",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Cadastrar primeiro cliente →
          </a>
        </div>
      )}

      {clientes.map((cliente) => {
        const resultados = matches[cliente.id];
        const idsSelecionados = imoveisSelecionados[cliente.id] || [];
        const matchesSelecionados = (resultados || []).filter((match) =>
          idsSelecionados.includes(match.id)
        );

        return (
          <div
            key={cliente.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 22,
              marginTop: 18,
              background: "#fff",
              boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
            }}
          >
            {/* CLIENTE */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 15,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 21,
                  }}
                >
                  {cliente.nome}
                </h3>

                {cliente.telefone && (
                  <div
                    style={{
                      marginTop: 6,
                      color: "#555",
                    }}
                  >
                    Telefone: {cliente.telefone}
                  </div>
                )}
              </div>

              {cliente.status && (
                <span
                  style={{
                    background: corStatus(cliente.status),
                    color: "#fff",
                    padding: "6px 11px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {formatarStatus(cliente.status)}
                </span>
              )}
            </div>

            {/* PERFIL DO CLIENTE */}

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {cliente.interesse && (
                <CampoCliente
                  titulo="Tipo de imóvel"
                  valor={formatarTipo(cliente.interesse)}
                />
              )}

              {cliente.finalidade && (
                <CampoCliente
                  titulo="Finalidade"
                  valor={formatarFinalidade(cliente.finalidade)}
                />
              )}

              {cliente.bairro && (
                <CampoCliente
                  titulo="Bairro"
                  valor={cliente.bairro}
                />
              )}

              {cliente.cidade && (
                <CampoCliente
                  titulo="Cidade"
                  valor={cliente.cidade}
                />
              )}

              {cliente.valor !== null && (
                <CampoCliente
                  titulo="Valor máximo"
                  valor={formatarValor(cliente.valor) || "-"}
                />
              )}
            </div>

            {/* AÇÕES */}

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <a
                href={`/clientes/${cliente.id}`}
                style={{
                  padding: "11px 16px",
                  borderRadius: 8,
                  background: "#f3f4f6",
                  color: "#111827",
                  textDecoration: "none",
                  fontWeight: 600,
                  border: "1px solid #d1d5db",
                }}
              >
                Ver cliente
              </a>

              <button
                onClick={() => encontrarImoveis(cliente.id)}
                disabled={carregandoMatch === cliente.id}
                style={{
                  padding: "11px 18px",
                  border: "none",
                  borderRadius: 8,
                  background:
                    carregandoMatch === cliente.id
                      ? "#9ca3af"
                      : "#111827",
                  color: "#fff",
                  fontWeight: 600,
                  cursor:
                    carregandoMatch === cliente.id
                      ? "wait"
                      : "pointer",
                }}
              >
                {carregandoMatch === cliente.id
                  ? "Procurando imóveis..."
                  : "🎯 Encontrar imóveis"}
              </button>
            </div>

            {/* RESULTADOS DO MATCH */}

            {resultados && (
              <div
                style={{
                  marginTop: 25,
                  paddingTop: 22,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 19,
                    }}
                  >
                    🎯 Imóveis compatíveis
                  </h4>

                  <span
                    style={{
                      color: "#666",
                      fontSize: 14,
                    }}
                  >
                    {resultados.length}{" "}
                    {resultados.length === 1
                      ? "imóvel encontrado"
                      : "imóveis encontrados"}
                  </span>

                  {resultados.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        enviarWhatsAppSelecionados(
                          cliente,
                          matchesSelecionados
                        )
                      }
                      disabled={matchesSelecionados.length === 0}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "none",
                        background:
                          matchesSelecionados.length === 0
                            ? "#9ca3af"
                            : "#16a34a",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 14,
                        cursor:
                          matchesSelecionados.length === 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Enviar {matchesSelecionados.length} imóveis pelo
                      WhatsApp
                    </button>
                  )}
                </div>

                {resultados.length === 0 ? (
                  <div
                    style={{
                      marginTop: 15,
                      padding: 18,
                      borderRadius: 10,
                      background: "#f9fafb",
                      color: "#666",
                    }}
                  >
                    Nenhum imóvel compatível encontrado.
                  </div>
                ) : (
                  resultados.map((match, index) => {
                    const acimaOrcamento = diferencaOrcamento(
                      match.valor,
                      cliente.valor
                    );

                    const scoreCor = corScore(match.score);
                    const selecionado = idsSelecionados.includes(
                      match.id
                    );

                    return (
                      <div
                        key={match.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          marginTop: 15,
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        {/* FOTO */}

                        {match.foto && (
                          <img
                            src={match.foto}
                            alt={match.nome}
                            style={{
                              width: "100%",
                              height: 260,
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        )}

                        <div
                          style={{
                            padding: 20,
                          }}
                        >
                          {/* CABEÇALHO IMÓVEL */}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 15,
                              flexWrap: "wrap",
                              alignItems: "flex-start",
                            }}
                          >
                            <div>
                              <label
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  fontSize: 13,
                                  color: "#6b7280",
                                  marginBottom: 5,
                                  cursor: "pointer",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selecionado}
                                  onChange={() =>
                                    alternarImovelSelecionado(
                                      cliente.id,
                                      match.id
                                    )
                                  }
                                />

                                <span>
                                  #{index + 1}
                                  {match.codigo
                                    ? ` • Código ${match.codigo}`
                                    : ""}
                                </span>
                              </label>

                              <strong
                                style={{
                                  fontSize: 19,
                                  display: "block",
                                }}
                              >
                                {match.nome}
                              </strong>

                              {(match.bairro ||
                                match.cidade) && (
                                <div
                                  style={{
                                    marginTop: 7,
                                    color: "#555",
                                  }}
                                >
                                  {[match.bairro, match.cidade]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              {match.destaque && (
                                <span
                                  style={{
                                    background: "#fef3c7",
                                    color: "#92400e",
                                    padding: "6px 10px",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  Destaque
                                </span>
                              )}

                              <span
                                style={{
                                  background: scoreCor,
                                  color: "#fff",
                                  padding: "7px 11px",
                                  borderRadius: 20,
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                {match.score}% •{" "}
                                {scoreTexto(match.score)}
                              </span>
                            </div>
                          </div>

                          {/* BARRA SCORE */}

                          <div
                            style={{
                              marginTop: 16,
                              height: 7,
                              background: "#e5e7eb",
                              borderRadius: 20,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(match.score, 100)
                                )}%`,
                                height: "100%",
                                background: scoreCor,
                                borderRadius: 20,
                              }}
                            />
                          </div>

                          <DetalhesCompatibilidade match={match} />

                          {/* TIPO */}

                          {(match.tipo || match.finalidade) && (
                            <div
                              style={{
                                marginTop: 15,
                                color: "#555",
                              }}
                            >
                              {[
                                formatarTipo(match.tipo),
                                formatarFinalidade(
                                  match.finalidade
                                ),
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
                          )}

                          {/* VALOR */}

                          {match.valor !== null && (
                            <div
                              style={{
                                marginTop: 12,
                                fontSize: 24,
                                fontWeight: 700,
                                color: "#111827",
                              }}
                            >
                              {formatarValor(match.valor)}
                            </div>
                          )}

                          {/* ACIMA DO ORÇAMENTO */}

                          {acimaOrcamento !== null && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: "9px 11px",
                                background: "#fff7ed",
                                border: "1px solid #fed7aa",
                                borderRadius: 8,
                                color: "#9a3412",
                                fontSize: 14,
                              }}
                            >
                              ⚠️{" "}
                              {formatarValor(acimaOrcamento)} acima
                              do valor máximo do cliente.
                            </div>
                          )}

                          {/* CARACTERÍSTICAS */}

                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              marginTop: 16,
                            }}
                          >
                            {match.quartos !== null && (
                              <Caracteristica
                                texto={`${match.quartos} quartos`}
                              />
                            )}

                            {match.suites !== null && (
                              <Caracteristica
                                texto={`${match.suites} suítes`}
                              />
                            )}

                            {match.banheiros !== null && (
                              <Caracteristica
                                texto={`${match.banheiros} banheiros`}
                              />
                            )}

                            {match.vagas !== null && (
                              <Caracteristica
                                texto={`${match.vagas} vagas`}
                              />
                            )}

                            {match.area !== null && (
                              <Caracteristica
                                texto={`${match.area} m²`}
                              />
                            )}
                          </div>

                          {/* ENDEREÇO */}

                          {match.endereco && (
                            <div
                              style={{
                                marginTop: 16,
                                color: "#555",
                                fontSize: 14,
                              }}
                            >
                              Endereço: {match.endereco}
                              {match.numero
                                ? `, ${match.numero}`
                                : ""}
                            </div>
                          )}

                          {/* DESCRIÇÃO */}

                          {match.descricao && (
                            <p
                              style={{
                                marginTop: 16,
                                marginBottom: 0,
                                color: "#555",
                                lineHeight: 1.6,
                              }}
                            >
                              {match.descricao}
                            </p>
                          )}

{/* AÇÕES DO IMÓVEL */}

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
    onClick={() => enviarWhatsApp(cliente, match)}
    style={{
      padding: "10px 14px",
      borderRadius: 8,
      border: "none",
      background: "#16a34a",
      color: "#fff",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
    }}
  >
    Enviar pelo WhatsApp
  </button>

  <a
    href={`/clientes/${cliente.id}`}
    style={{
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      background: "#fff",
      color: "#111827",
      fontWeight: 600,
      fontSize: 14,
      textDecoration: "none",
    }}
  >
    Ver cliente
  </a>
</div>

                          {/* LINKS */}

                          {(match.quintoandar ||
                            match.orulo) && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 10,
                                marginTop: 18,
                                paddingTop: 16,
                                borderTop:
                                  "1px solid #e5e7eb",
                              }}
                            >
                              {match.quintoandar && (
                                <a
                                  href={match.quintoandar}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    background: "#2563eb",
                                    color: "#fff",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    fontSize: 14,
                                  }}
                                >
                                  Abrir no QuintoAndar
                                </a>
                              )}

                              {match.orulo && (
                                <a
                                  href={match.orulo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "10px 14px",
                                    borderRadius: 8,
                                    background: "#111827",
                                    color: "#fff",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    fontSize: 14,
                                  }}
                                >
                                  Abrir no Órulo
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </main>
  );
}

function CampoCliente({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 9,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 5,
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {valor}
      </div>
    </div>
  );
}

function Caracteristica({
  texto,
}: {
  texto: string;
}) {
  return (
    <span
      style={{
        padding: "7px 10px",
        background: "#f3f4f6",
        borderRadius: 8,
        fontSize: 13,
        color: "#374151",
      }}
    >
      {texto}
    </span>
  );
}

function DetalhesCompatibilidade({
  match,
}: {
  match: Match;
}) {
  if (!match.detalhesScore || match.detalhesScore.length === 0) {
    return null;
  }

  const cores: Record<StatusDetalheScore, string> = {
    atende: "#166534",
    parcial: "#92400e",
    nao_atende: "#991b1b",
    desconhecido: "#4b5563",
  };

  const icones: Record<StatusDetalheScore, string> = {
    atende: "✓",
    parcial: "!",
    nao_atende: "x",
    desconhecido: "?",
  };

  return (
    <details
      style={{
        marginTop: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
        background: "#f9fafb",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Ver compatibilidade
      </summary>

      {match.pontosPossiveis !== undefined &&
        match.pontosPossiveis > 0 && (
          <div
            style={{
              marginTop: 10,
              color: "#4b5563",
              fontSize: 14,
            }}
          >
            Pontuação: {match.pontosObtidos} de{" "}
            {match.pontosPossiveis} pontos possíveis
          </div>
        )}

      <div
        style={{
          display: "grid",
          gap: 8,
          marginTop: 10,
        }}
      >
        {match.detalhesScore.map((detalhe) => (
          <div
            key={detalhe.criterio}
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr auto",
              gap: 8,
              alignItems: "start",
              fontSize: 14,
            }}
          >
            <span style={{ color: cores[detalhe.status], fontWeight: 800 }}>
              {icones[detalhe.status]}
            </span>

            <span>
              <strong>{detalhe.label}:</strong>{" "}
              {detalhe.descricao}
            </span>

            <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>
              {detalhe.pontos}/{detalhe.pontosPossiveis}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
