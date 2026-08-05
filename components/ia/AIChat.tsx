"use client";

import { useState } from "react";
import { perguntarIA } from "@/services/ia";

export default function AIChat() {
  const [prompt, setPrompt] = useState("");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  async function enviar() {
    if (!prompt) return;

    setLoading(true);

    try {
      const data = await perguntarIA(prompt);
      setResposta(data.resposta);
    } catch {
      setResposta("Erro ao consultar IA.");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">

      <textarea
        rows={8}
        className="w-full rounded-lg border p-4"
        placeholder="Descreva o que deseja..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={enviar}
        className="rounded-lg bg-black px-6 py-3 text-white"
      >
        {loading ? "Consultando..." : "Enviar"}
      </button>

      {resposta && (
        <div className="rounded-xl border bg-gray-50 p-6 whitespace-pre-wrap">
          {resposta}
        </div>
      )}

    </div>
  );
}