"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      alert("Informe o e-mail e a senha.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setCarregando(false);
      alert(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "40px",
      }}
    >
      <h1>Login - Inova Social AI</h1>

      <input
        type="email"
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
        onClick={entrar}
        disabled={carregando}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
        }}
      >
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </div>
  );
}