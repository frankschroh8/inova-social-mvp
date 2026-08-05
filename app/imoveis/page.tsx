"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ImoveisPage() {

  const [titulo, setTitulo] = useState("");
  const [bairro, setBairro] = useState("");
  const [valor, setValor] = useState("");

  const [imoveis, setImoveis] = useState<any[]>([]);

  useEffect(() => {
    carregarImoveis();
  }, []);

  async function carregarImoveis() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("imoveis")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setImoveis(data || []);
  }

  async function salvar() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Faça login.");
      return;
    }

    await supabase.from("imoveis").insert({

      user_id: user.id,

      titulo,

      bairro,

      valor: Number(valor)

    });

    setTitulo("");
    setBairro("");
    setValor("");

    carregarImoveis();
  }

  return (

    <main style={{ padding: 40 }}>

      <h1>Cadastro de Imóveis</h1>

      <input
        placeholder="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Bairro"
        value={bairro}
        onChange={(e) => setBairro(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Valor"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />

      <br /><br />

      <button onClick={salvar}>
        Salvar Imóvel
      </button>

      <hr />

      {imoveis.map((imovel) => (

        <div
          key={imovel.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginBottom: 10,
          }}
        >

          <strong>{imovel.titulo}</strong>

          <br />

          {imovel.bairro}

          <br />

          R$ {Number(imovel.valor).toLocaleString("pt-BR")}

        </div>

      ))}

    </main>

  );
}