"use client";

import { useState } from "react";
import { buscarCEP } from "@/services/cep";

export default function DadosEndereco() {
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  async function consultar() {
    const endereco = await buscarCEP(cep);

    if (!endereco) return;

    setRua(endereco.logradouro);
    setBairro(endereco.bairro);
    setCidade(endereco.localidade);
    setEstado(endereco.uf);
  }

  return (
    <div className="space-y-3">

      <input
        placeholder="CEP"
        value={cep}
        onBlur={consultar}
        onChange={(e) => setCep(e.target.value)}
      />

      <input value={rua} placeholder="Rua" readOnly />

      <input value={bairro} placeholder="Bairro" readOnly />

      <input value={cidade} placeholder="Cidade" readOnly />

      <input value={estado} placeholder="UF" readOnly />

    </div>
  );
}