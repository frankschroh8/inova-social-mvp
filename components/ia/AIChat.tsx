"use client";

import { useState } from "react";

export default function AIChat() {

  const [prompt, setPrompt] = useState("");

  async function enviar() {

    if (!prompt) return;

    alert("Em breve enviaremos para a IA:\n\n" + prompt);

  }

  return (

    <div className="space-y-4">

      <textarea

        className="w-full border rounded-lg p-4"

        rows={8}

        placeholder="Ex.: Gere um anúncio para este apartamento..."

        value={prompt}

        onChange={(e) => setPrompt(e.target.value)}

      />

      <button

        className="rounded-lg bg-black text-white px-6 py-3"

        onClick={enviar}

      >

        Enviar para IA

      </button>

    </div>

  );

}