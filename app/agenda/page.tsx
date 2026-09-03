"use client";

import { useEffect, useState } from "react";
import AgendaList from "@/components/agenda/AgendaList";
import { criarCompromisso } from "@/services/agenda";
import { supabase } from "@/lib/supabase";

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
}

export default function AgendaPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");

  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
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
        .select("id, nome, telefone")
        .eq("user_id", user.id)
        .order("nome", { ascending: true });

      if (error) {
        console.error("Erro ao carregar clientes:", error);
        alert("Erro ao carregar clientes.");
        return;
      }

      setClientes(data || []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar clientes.");
    } finally {
      setCarregandoClientes(false);
    }
  }

  async function salvarCompromisso() {
    if (!clienteId) {
      alert("Selecione o cliente.");
      return;
    }

    if (!titulo.trim()) {
      alert("Digite o título do compromisso.");
      return;
    }

    if (!dataInicio) {
      alert("Informe a data e hora.");
      return;
    }

    setSalvando(true);

    try {
      const resultado = await criarCompromisso({
        cliente_id: clienteId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        data_inicio: new Date(dataInicio).toISOString(),
        status: "agendado",
      });

      if (resultado?.error) {
        throw resultado.error;
      }

      setClienteId("");
      setTitulo("");
      setDescricao("");
      setDataInicio("");

      alert("Compromisso criado com sucesso!");

      window.location.reload();
    } catch (error) {
      console.error("Erro ao criar compromisso:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao criar compromisso."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        Agenda
      </h1>

      <section className="border rounded-xl p-6 mb-8 bg-white shadow-sm">

        <h2 className="text-xl font-semibold mb-4">
          Novo compromisso
        </h2>

        <label className="block mb-2 font-medium">
          Cliente
        </label>

        <select
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          disabled={carregandoClientes || salvando}
          className="w-full border rounded-lg p-3 mb-4"
        >
          <option value="">
            {carregandoClientes
              ? "Carregando clientes..."
              : "Selecione o cliente"}
          </option>

          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
              {cliente.telefone
                ? ` - ${cliente.telefone}`
                : ""}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Título do compromisso"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          disabled={salvando}
          className="w-full border rounded-lg p-3 mb-4"
        />

        <textarea
          placeholder="Descrição / observação"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          disabled={salvando}
          className="w-full border rounded-lg p-3 mb-4"
          rows={4}
        />

        <label className="block mb-2 font-medium">
          Data e hora
        </label>

        <input
          type="datetime-local"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          disabled={salvando}
          className="border rounded-lg p-3 mb-4"
        />

        <br />

        <button
          onClick={salvarCompromisso}
          disabled={salvando || carregandoClientes}
          className="bg-black text-white rounded-lg px-5 py-3"
        >
          {salvando
            ? "Salvando..."
            : "Salvar compromisso"}
        </button>

      </section>

      <AgendaList />

    </main>
  );
}