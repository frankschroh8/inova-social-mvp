"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function cadastrar() {
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Conta criada com sucesso!");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        padding: "40px",
      }}
    >
      <h1>Cadastro - Inova Social AI</h1>

      <input
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          display: "block",
          width: "300px",
          padding: "10px",
          marginTop: "20px",
        }}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        style={{
          display: "block",
          width: "300px",
          padding: "10px",
          marginTop: "10px",
        }}
      />

      <button
        onClick={cadastrar}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
        }}
      >
        Criar Conta
      </button>
    </div>
  );
}