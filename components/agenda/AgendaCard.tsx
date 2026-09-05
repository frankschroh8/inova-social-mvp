"use client";

import { useState } from "react";
import {
  concluirCompromisso,
  reagendarCompromisso,
} from "@/services/agenda";
import { supabase } from "@/lib/supabase";

interface Props {
  item: any;
}

const RESULTADOS_VISITA = [
  "Interessado",
  "Muito interessado",
  "Sem interesse",
  "Quer nova visita",
  "Vai fazer proposta",
  "Não compareceu",
  "Outro",
];

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

export default function AgendaCard({ item }: Props) {
  const [reagendando, setReagendando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [registrandoResultado, setRegistrandoResultado] = useState(false);

  const [novaData, setNovaData] = useState("");
  const [novoTitulo, setNovoTitulo] = useState(item.titulo || "");
  const [novaDescricao, setNovaDescricao] = useState(
    item.descricao || ""
  );
  const [resultadoVisita, setResultadoVisita] = useState("");
  const [observacaoResultado, setObservacaoResultado] = useState("");

  const [salvando, setSalvando] = useState(false);

  const data = item.data ? new Date(item.data) : null;

  const dataFormatada = data
    ? data.toLocaleDateString("pt-BR")
    : "Data não informada";

  const horaFormatada = data
    ? data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  async function concluir() {
    if (!item.id) return;

    if (item.cliente_id) {
      setRegistrandoResultado(true);
      setReagendando(false);
      setEditando(false);
      return;
    }

    const confirmar = window.confirm(
      "Deseja marcar este compromisso como concluído?"
    );

    if (!confirmar) return;

    setSalvando(true);

    try {
      await concluirCompromisso(item.id);

      alert("Compromisso concluído com sucesso!");

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao concluir compromisso."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarResultadoVisita() {
    if (!item.id) return;

    if (!resultadoVisita) {
      alert("Selecione o resultado da visita.");
      return;
    }

    setSalvando(true);

    try {
      await concluirCompromisso(item.id, {
        cliente_id: item.cliente_id,
        titulo: item.titulo || null,
        data: item.data || null,
        resultado: resultadoVisita,
        observacao: observacaoResultado.trim() || null,
      });

      alert("Visita concluída e resultado registrado com sucesso!");

      setRegistrandoResultado(false);
      setResultadoVisita("");
      setObservacaoResultado("");

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao registrar resultado da visita."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function reagendar() {
    if (!novaData) {
      alert("Informe a nova data e hora.");
      return;
    }

    setSalvando(true);

    try {
      await reagendarCompromisso(
        item.id,
        novaData
      );

      alert("Compromisso reagendado com sucesso!");

      setReagendando(false);
      setNovaData("");

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao reagendar compromisso."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao() {
    if (!novoTitulo.trim()) {
      alert("Digite o título do compromisso.");
      return;
    }

    setSalvando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não está logado.");
      }

      const dados: any = {
        titulo: novoTitulo.trim(),
        descricao:
          novaDescricao.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (novaData) {
        dados.data_inicio = new Date(
          novaData
        ).toISOString();
      }

      const { error } = await supabase
        .from("agenda")
        .update(dados)
        .eq("id", item.id)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(
          `Erro ao salvar edição: ${error.message}`
        );
      }

      alert("Compromisso atualizado com sucesso!");

      setEditando(false);

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao editar compromisso."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">

      {!editando ? (
        <>
          <h3 className="text-lg font-semibold">
            👤 {item.titulo}
          </h3>

          {item.telefone && (
            <p className="text-sm text-gray-600 mt-1">
              📞 {item.telefone}
            </p>
          )}

          <p className="text-sm text-gray-700 mt-3">
            📅 {dataFormatada}
          </p>

          <p className="text-sm text-gray-700">
            🕐 {horaFormatada}
          </p>

          {item.status && (
            <p className="text-sm text-gray-500 mt-2">
              🔄 Status: {item.status}
            </p>
          )}

          {item.situacaoFollowUp && (
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classeFollowUp(
                item.situacaoFollowUp
              )}`}
            >
              Follow-up: {rotuloFollowUp(item.situacaoFollowUp)}
            </span>
          )}

          {item.descricao && (
            <p className="text-sm text-gray-600 mt-2">
              📝 {item.descricao}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">

            {item.cliente_id && (
              <a
                href={`/clientes/${item.cliente_id}`}
                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
              >
                Abrir cliente
              </a>
            )}

            {item.origem === "agenda" &&
              item.status !== "concluido" && (
                <>
                  <button
                    onClick={() =>
                      setEditando(true)
                    }
                    disabled={salvando}
                    className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white"
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={concluir}
                    disabled={salvando}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
                  >
                    {salvando
                      ? "Salvando..."
                      : "✓ Concluir"}
                  </button>

                  <button
                    onClick={() =>
                      setReagendando(!reagendando)
                    }
                    disabled={salvando}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
                  >
                    📅 Reagendar
                  </button>
                </>
              )}

          </div>

          {reagendando && (
            <div className="mt-4 rounded-lg border p-4 bg-gray-50">

              <label className="block text-sm font-medium mb-2">
                Nova data e hora
              </label>

              <input
                type="datetime-local"
                value={novaData}
                onChange={(e) =>
                  setNovaData(e.target.value)
                }
                className="border rounded-lg p-3 w-full mb-3"
              />

              <div className="flex gap-2">

                <button
                  onClick={reagendar}
                  disabled={salvando}
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar nova data"}
                </button>

                <button
                  onClick={() => {
                    setReagendando(false);
                    setNovaData("");
                  }}
                  disabled={salvando}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancelar
                </button>

              </div>

            </div>
          )}

          {registrandoResultado && (
            <div className="mt-4 rounded-lg border p-4 bg-gray-50">

              <h4 className="font-semibold text-gray-900">
                Resultado da visita
              </h4>

              <label className="mt-4 block text-sm font-medium mb-2">
                Resultado
              </label>

              <select
                value={resultadoVisita}
                onChange={(e) =>
                  setResultadoVisita(e.target.value)
                }
                disabled={salvando}
                className="border rounded-lg p-3 w-full mb-3"
              >
                <option value="">Selecione o resultado</option>

                {RESULTADOS_VISITA.map((resultado) => (
                  <option key={resultado} value={resultado}>
                    {resultado}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium mb-2">
                Observação
              </label>

              <textarea
                value={observacaoResultado}
                onChange={(e) =>
                  setObservacaoResultado(e.target.value)
                }
                disabled={salvando}
                rows={4}
                placeholder="Observações opcionais sobre a visita..."
                className="border rounded-lg p-3 w-full mb-3"
              />

              <div className="flex flex-wrap gap-2">

                <button
                  onClick={confirmarResultadoVisita}
                  disabled={salvando}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
                >
                  {salvando
                    ? "Salvando..."
                    : "Concluir e registrar"}
                </button>

                <button
                  onClick={() => {
                    setRegistrandoResultado(false);
                    setResultadoVisita("");
                    setObservacaoResultado("");
                  }}
                  disabled={salvando}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancelar
                </button>

              </div>

            </div>
          )}
        </>
      ) : (
        <div>

          <h3 className="text-lg font-semibold mb-4">
            ✏️ Editar compromisso
          </h3>

          <label className="block text-sm font-medium mb-1">
            Título
          </label>

          <input
            value={novoTitulo}
            onChange={(e) =>
              setNovoTitulo(e.target.value)
            }
            className="border rounded-lg p-3 w-full mb-4"
          />

          <label className="block text-sm font-medium mb-1">
            Descrição / observação
          </label>

          <textarea
            value={novaDescricao}
            onChange={(e) =>
              setNovaDescricao(e.target.value)
            }
            rows={4}
            className="border rounded-lg p-3 w-full mb-4"
          />

          <label className="block text-sm font-medium mb-1">
            Nova data e hora
          </label>

          <input
            type="datetime-local"
            value={novaData}
            onChange={(e) =>
              setNovaData(e.target.value)
            }
            className="border rounded-lg p-3 w-full mb-4"
          />

          <div className="flex gap-2">

            <button
              onClick={salvarEdicao}
              disabled={salvando}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              {salvando
                ? "Salvando..."
                : "💾 Salvar alterações"}
            </button>

            <button
              onClick={() => {
                setEditando(false);
                setNovoTitulo(item.titulo || "");
                setNovaDescricao(
                  item.descricao || ""
                );
                setNovaData("");
              }}
              disabled={salvando}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancelar
            </button>

          </div>

        </div>
      )}

    </div>
  );
}
