"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSalvar: (cliente: any) => Promise<void>;
}

export default function ClienteForm({ onSalvar }: Props) {
  const [cliente, setCliente] = useState({
    nome: "",
    telefone: "",
    email: "",
    interesse: "",
    origem: "Manual",
    status: "Novo Lead",
    observacoes: "",
  });

  function alterarCampo(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setCliente({
      ...cliente,
      [e.target.name]: e.target.value,
    });
  }

  async function salvar() {
    if (!cliente.nome) {
      alert("Informe o nome.");
      return;
    }

    await onSalvar(cliente);

    setCliente({
      nome: "",
      telefone: "",
      email: "",
      interesse: "",
      origem: "Manual",
      status: "Novo Lead",
      observacoes: "",
    });
  }

  return (
    <div className="space-y-4 rounded-xl border p-6">

      <h2 className="text-xl font-bold">
        Novo Cliente
      </h2>

      <Input
        placeholder="Nome"
        name="nome"
        value={cliente.nome}
        onChange={alterarCampo}
      />

      <Input
        placeholder="Telefone"
        name="telefone"
        value={cliente.telefone}
        onChange={alterarCampo}
      />

      <Input
        placeholder="E-mail"
        name="email"
        value={cliente.email}
        onChange={alterarCampo}
      />

      <Input
        placeholder="Interesse"
        name="interesse"
        value={cliente.interesse}
        onChange={alterarCampo}
      />

      <textarea
        className="w-full rounded-md border p-3"
        rows={4}
        placeholder="Observações"
        name="observacoes"
        value={cliente.observacoes}
        onChange={alterarCampo}
      />

      <Button onClick={salvar}>
        Salvar Cliente
      </Button>

    </div>
  );
}