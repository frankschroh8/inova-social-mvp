"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientesPage() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
  alert("Usuário não está logado");
  return;
}

    const { data } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setClientes(data || []);
  }

  async function salvarCliente() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

  if (!user) {
  alert("Usuário não está logado");
  return;
}

    await supabase.from("clientes").insert({
      user_id: user.id,
      nome,
      telefone,
    });

    setNome("");
    setTelefone("");

    carregarClientes();
  }

  return (
    <main style={{ padding: 40 }}>

      <h1>Clientes</h1>

      <input
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <br />
      <br />

      <input
        placeholder="Telefone"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />

      <br />
      <br />

      <button onClick={salvarCliente}>
        Salvar Cliente
      </button>

      <hr />

      {clientes.map((cliente) => (

        <div
          key={cliente.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginTop: 10,
          }}
        >
          <strong>{cliente.nome}</strong>

          <br />

          {cliente.telefone}

        </div>

      ))}

    </main>
  );
}