"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NovoClientePage() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [interesse, setInteresse] = useState("");
  const [finalidade, setFinalidade] = useState("venda");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Curitiba");
  const [valorMin, setValorMin] = useState("");
  const [valor, setValor] = useState("");
  const [quartosMin, setQuartosMin] = useState("");
  const [suitesMin, setSuitesMin] = useState("");
  const [banheirosMin, setBanheirosMin] = useState("");
  const [vagasMin, setVagasMin] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState("Novo");

  const [salvando, setSalvando] = useState(false);

  async function salvarCliente() {
    if (!nome.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    if (!interesse) {
      alert("Selecione o tipo de imóvel.");
      return;
    }

    if (!finalidade) {
      alert("Selecione a finalidade.");
      return;
    }

    if (valorMin && Number(valorMin) < 0) {
      alert("Informe um valor mínimo válido.");
      return;
    }

    if (valor && Number(valor) < 0) {
      alert("Informe um valor máximo válido.");
      return;
    }

    if (valorMin && valor && Number(valorMin) > Number(valor)) {
      alert("O valor mínimo não pode ser maior que o valor máximo.");
      return;
    }

    if (quartosMin && Number(quartosMin) < 0) {
      alert("Informe uma quantidade válida de quartos.");
      return;
    }

    if (suitesMin && Number(suitesMin) < 0) {
      alert("Informe uma quantidade válida de suítes.");
      return;
    }

    if (banheirosMin && Number(banheirosMin) < 0) {
      alert("Informe uma quantidade válida de banheiros.");
      return;
    }

    if (vagasMin && Number(vagasMin) < 0) {
      alert("Informe uma quantidade válida de vagas.");
      return;
    }

    if (areaMin && Number(areaMin) < 0) {
      alert("Informe uma área mínima válida.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Usuário não está logado.");
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.from("clientes").insert({
        user_id: user.id,
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        interesse: interesse.trim() || null,
        finalidade: finalidade.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        valor_min: valorMin ? Number(valorMin) : null,
        valor: valor ? Number(valor) : null,
        quartos_min: quartosMin ? Number(quartosMin) : null,
        suites_min: suitesMin ? Number(suitesMin) : null,
        banheiros_min: banheirosMin ? Number(banheirosMin) : null,
        vagas_min: vagasMin ? Number(vagasMin) : null,
        area_min: areaMin ? Number(areaMin) : null,
        observacoes: observacoes.trim() || null,
        status,
      });

      if (error) {
        console.error("Erro ao salvar cliente:", error);
        alert(`Erro ao salvar cliente: ${error.message}`);
        return;
      }

      alert("Cliente cadastrado com sucesso!");

      window.location.href = "/clientes";
    } catch (error) {
      console.error("Erro inesperado:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar cliente."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">

        <a
          href="/clientes"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Voltar para clientes
        </a>

        <h1 className="mt-4 text-3xl font-bold">
          Novo Cliente
        </h1>

        <p className="mt-2 text-gray-600">
          Cadastre os dados e as preferências do cliente.
        </p>

        <div className="mt-8 space-y-6 rounded-xl bg-white p-6 shadow">

          {/* =========================
              DADOS DO CLIENTE
          ========================== */}

          <div>
            <h2 className="text-xl font-semibold">
              Dados do cliente
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Informações básicas para contato.
            </p>
          </div>

          <div>
            <label className="block font-medium">
              Nome *
            </label>

            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block font-medium">
              Telefone
            </label>

            <input
              type="text"
              placeholder="Ex.: (41) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block font-medium">
              E-mail
            </label>

            <input
              type="email"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          {/* =========================
              INTERESSE
          ========================== */}

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold">
              Interesse imobiliário
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Defina o que o cliente está procurando.
            </p>
          </div>

          <div>
            <label className="block font-medium">
              Tipo de imóvel *
            </label>

            <select
              value={interesse}
              onChange={(e) => setInteresse(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            >
              <option value="">Selecione</option>
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="sobrado">Sobrado</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Imóvel comercial</option>
              <option value="studio">Studio</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block font-medium">
              Finalidade *
            </label>

            <select
              value={finalidade}
              onChange={(e) => setFinalidade(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            >
              <option value="venda">
                Compra
              </option>

              <option value="locacao">
                Locação
              </option>
            </select>

            <p className="mt-1 text-sm text-gray-500">
              O cliente deseja comprar ou alugar o imóvel?
            </p>
          </div>

          <div>
            <label className="block font-medium">
              Bairro de interesse
            </label>

            <input
              type="text"
              placeholder="Ex.: Água Verde"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block font-medium">
              Cidade
            </label>

            <input
              type="text"
              placeholder="Ex.: Curitiba"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold">
              Preferências do imóvel
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Critérios mínimos para qualificar melhor as opções.
            </p>
          </div>

          <div>
            <label className="block font-medium">
              Valor mínimo
            </label>

            <input
              type="number"
              min="0"
              placeholder="Ex.: 500000"
              value={valorMin}
              onChange={(e) => setValorMin(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="block font-medium">
              Valor máximo
            </label>

            <input
              type="number"
              min="0"
              placeholder="Ex.: 550000"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            />

            <p className="mt-1 text-sm text-gray-500">
              Valor máximo que o cliente pretende investir.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block font-medium">
                Quartos mínimos
              </label>

              <input
                type="number"
                min="0"
                value={quartosMin}
                onChange={(e) => setQuartosMin(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="block font-medium">
                Suítes mínimas
              </label>

              <input
                type="number"
                min="0"
                value={suitesMin}
                onChange={(e) => setSuitesMin(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="block font-medium">
                Banheiros mínimos
              </label>

              <input
                type="number"
                min="0"
                value={banheirosMin}
                onChange={(e) => setBanheirosMin(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="block font-medium">
                Vagas mínimas
              </label>

              <input
                type="number"
                min="0"
                value={vagasMin}
                onChange={(e) => setVagasMin(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="block font-medium">
                Área mínima
              </label>

              <input
                type="number"
                min="0"
                value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </div>
          </div>

          {/* =========================
              STATUS
          ========================== */}

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold">
              Atendimento
            </h2>
          </div>

          <div>
            <label className="block font-medium">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-lg border p-3"
            >
              <option value="Novo">
                Novo
              </option>

              <option value="Em atendimento">
                Em atendimento
              </option>

              <option value="Negociação">
                Negociação
              </option>

              <option value="Proposta">
                Proposta
              </option>

              <option value="Cliente">
                Cliente
              </option>

              <option value="Inativo">
                Inativo
              </option>
            </select>
          </div>

          {/* =========================
              OBSERVAÇÕES
          ========================== */}

          <div>
            <label className="block font-medium">
              Observações
            </label>

            <textarea
              placeholder="Preferências, necessidades, informações importantes..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border p-3"
            />
          </div>

          {/* =========================
              BOTÃO
          ========================== */}

          <button
            onClick={salvarCliente}
            disabled={salvando}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando
              ? "Salvando..."
              : "Salvar Cliente"}
          </button>

        </div>
      </div>
    </main>
  );
}
