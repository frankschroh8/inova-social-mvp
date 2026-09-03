"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Imovel {
  id: string;
  titulo: string;
  codigo: string | null;
  tipo: string | null;
  finalidade: string | null;
  status: string | null;
  categoria: string | null;
  valor: number | null;
  condominio: number | null;
  iptu: number | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  area: number | null;
  area_util: number | null;
  area_total: number | null;
  metragem: number | null;
  descricao: string | null;
  foto: string | null;
  quintoandar: string | null;
  orulo: string | null;
  destaque: boolean | null;
  proprietario: string | null;
  telefone: string | null;
  email: string | null;
  user_id: string;
}

type ImovelForm = {
  titulo: string;
  codigo: string;
  tipo: string;
  finalidade: string;
  status: string;
  categoria: string;
  valor: string;
  condominio: string;
  iptu: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  endereco: string;
  numero: string;
  quartos: string;
  suites: string;
  banheiros: string;
  vagas: string;
  area: string;
  area_util: string;
  area_total: string;
  metragem: string;
  descricao: string;
  foto: string;
  quintoandar: string;
  orulo: string;
  destaque: boolean;
  proprietario: string;
  telefone: string;
  email: string;
};

const formVazio: ImovelForm = {
  titulo: "",
  codigo: "",
  tipo: "apartamento",
  finalidade: "venda",
  status: "disponivel",
  categoria: "",
  valor: "",
  condominio: "",
  iptu: "",
  bairro: "",
  cidade: "Curitiba",
  estado: "",
  cep: "",
  endereco: "",
  numero: "",
  quartos: "",
  suites: "",
  banheiros: "",
  vagas: "",
  area: "",
  area_util: "",
  area_total: "",
  metragem: "",
  descricao: "",
  foto: "",
  quintoandar: "",
  orulo: "",
  destaque: false,
  proprietario: "",
  telefone: "",
  email: "",
};

export default function ImoveisPage() {
  const [formCadastro, setFormCadastro] =
    useState<ImovelForm>(formVazio);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [formEdicao, setFormEdicao] = useState<ImovelForm>(formVazio);

  useEffect(() => {
    carregarImoveis();
  }, []);

  function formatarValor(valorImovel: number | null) {
    if (valorImovel === null || valorImovel === undefined) {
      return "Não informado";
    }

    return Number(valorImovel).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  }

  function numeroParaFormulario(valorImovel: number | null) {
    return valorImovel !== null && valorImovel !== undefined
      ? String(valorImovel)
      : "";
  }

  function textoOuNull(valorTexto: string) {
    return valorTexto.trim() || null;
  }

  function numeroOuNull(valorTexto: string) {
    return valorTexto ? Number(valorTexto) : null;
  }

  function formularioValido(formulario: ImovelForm) {
    if (!formulario.titulo.trim()) {
      alert("Informe o título do imóvel.");
      return false;
    }

    if (!formulario.tipo.trim()) {
      alert("Informe o tipo do imóvel.");
      return false;
    }

    if (!formulario.finalidade.trim()) {
      alert("Informe a finalidade do imóvel.");
      return false;
    }

    if (
      !formulario.valor ||
      Number.isNaN(Number(formulario.valor)) ||
      Number(formulario.valor) <= 0
    ) {
      alert("Informe um valor válido maior que zero.");
      return false;
    }

    if (!formulario.bairro.trim()) {
      alert("Informe o bairro.");
      return false;
    }

    if (!formulario.cidade.trim()) {
      alert("Informe a cidade.");
      return false;
    }

    return true;
  }

  function formularioEdicaoValido(formulario: ImovelForm) {
    if (!formulario.titulo.trim()) {
      alert("Informe o título do imóvel.");
      return false;
    }

    if (
      formulario.valor &&
      (Number.isNaN(Number(formulario.valor)) || Number(formulario.valor) < 0)
    ) {
      alert("Informe um valor válido.");
      return false;
    }

    return true;
  }

  function dadosDoFormulario(formulario: ImovelForm) {
    return {
      titulo: formulario.titulo.trim(),
      codigo: textoOuNull(formulario.codigo),
      tipo: textoOuNull(formulario.tipo),
      finalidade: formulario.finalidade,
      status: formulario.status || "disponivel",
      categoria: textoOuNull(formulario.categoria),
      valor: numeroOuNull(formulario.valor),
      condominio: numeroOuNull(formulario.condominio),
      iptu: numeroOuNull(formulario.iptu),
      bairro: textoOuNull(formulario.bairro),
      cidade: textoOuNull(formulario.cidade),
      estado: textoOuNull(formulario.estado),
      cep: textoOuNull(formulario.cep),
      endereco: textoOuNull(formulario.endereco),
      numero: textoOuNull(formulario.numero),
      quartos: numeroOuNull(formulario.quartos),
      suites: numeroOuNull(formulario.suites),
      banheiros: numeroOuNull(formulario.banheiros),
      vagas: numeroOuNull(formulario.vagas),
      area: numeroOuNull(formulario.area),
      area_util: numeroOuNull(formulario.area_util),
      area_total: numeroOuNull(formulario.area_total),
      metragem: numeroOuNull(formulario.metragem),
      descricao: textoOuNull(formulario.descricao),
      foto: textoOuNull(formulario.foto),
      quintoandar: textoOuNull(formulario.quintoandar),
      orulo: textoOuNull(formulario.orulo),
      destaque: formulario.destaque,
      proprietario: textoOuNull(formulario.proprietario),
      telefone: textoOuNull(formulario.telefone),
      email: textoOuNull(formulario.email),
    };
  }

  function atualizarCampoCadastro<K extends keyof ImovelForm>(
    campo: K,
    valorCampo: ImovelForm[K]
  ) {
    setFormCadastro((anterior) => ({
      ...anterior,
      [campo]: valorCampo,
    }));
  }

  function atualizarCampo<K extends keyof ImovelForm>(
    campo: K,
    valorCampo: ImovelForm[K]
  ) {
    setFormEdicao((anterior) => ({
      ...anterior,
      [campo]: valorCampo,
    }));
  }

  function preencherEdicao(imovel: Imovel) {
    setFormEdicao({
      titulo: imovel.titulo || "",
      codigo: imovel.codigo || "",
      tipo: imovel.tipo || "apartamento",
      finalidade: imovel.finalidade || "venda",
      status: imovel.status || "disponivel",
      categoria: imovel.categoria || "",
      valor: numeroParaFormulario(imovel.valor),
      condominio: numeroParaFormulario(imovel.condominio),
      iptu: numeroParaFormulario(imovel.iptu),
      bairro: imovel.bairro || "",
      cidade: imovel.cidade || "",
      estado: imovel.estado || "",
      cep: imovel.cep || "",
      endereco: imovel.endereco || "",
      numero: imovel.numero || "",
      quartos: numeroParaFormulario(imovel.quartos),
      suites: numeroParaFormulario(imovel.suites),
      banheiros: numeroParaFormulario(imovel.banheiros),
      vagas: numeroParaFormulario(imovel.vagas),
      area: numeroParaFormulario(imovel.area),
      area_util: numeroParaFormulario(imovel.area_util),
      area_total: numeroParaFormulario(imovel.area_total),
      metragem: numeroParaFormulario(imovel.metragem),
      descricao: imovel.descricao || "",
      foto: imovel.foto || "",
      quintoandar: imovel.quintoandar || "",
      orulo: imovel.orulo || "",
      destaque: Boolean(imovel.destaque),
      proprietario: imovel.proprietario || "",
      telefone: imovel.telefone || "",
      email: imovel.email || "",
    });

    setEditandoId(imovel.id);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setFormEdicao(formVazio);
  }

  async function carregarImoveis() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setImoveis([]);
      return;
    }

    const { data, error } = await supabase
      .from("imoveis")
      .select(`
        id,
        titulo,
        codigo,
        tipo,
        finalidade,
        status,
        categoria,
        valor,
        condominio,
        iptu,
        bairro,
        cidade,
        estado,
        cep,
        endereco,
        numero,
        quartos,
        suites,
        banheiros,
        vagas,
        area,
        area_util,
        area_total,
        metragem,
        descricao,
        foto,
        quintoandar,
        orulo,
        destaque,
        proprietario,
        telefone,
        email,
        user_id
      `)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar imóveis:", error);
      alert("Erro ao carregar imóveis.");
      return;
    }

    setImoveis(data || []);
  }

  async function salvar() {
    if (!formularioValido(formCadastro)) {
      return;
    }

    setSalvando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Faça login para cadastrar um imóvel.");
        return;
      }

      const { error } = await supabase
        .from("imoveis")
        .insert({
          user_id: user.id,
          ...dadosDoFormulario(formCadastro),
        });

      if (error) {
        console.error("Erro ao salvar imóvel:", error);
        alert(`Erro ao salvar imóvel: ${error.message}`);
        return;
      }

      setFormCadastro(formVazio);

      await carregarImoveis();

      alert("Imóvel cadastrado com sucesso!");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(imovel: Imovel) {
    if (!formularioEdicaoValido(formEdicao)) {
      return;
    }

    setSalvandoEdicao(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Faça login para editar o imóvel.");
        return;
      }

      const { data, error } = await supabase
        .from("imoveis")
        .update({
          ...dadosDoFormulario(formEdicao),
          updated_at: new Date().toISOString(),
        })
        .eq("id", imovel.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao editar imóvel:", error);
        alert(`Erro ao editar imóvel: ${error.message}`);
        return;
      }

      setImoveis((anteriores) =>
        anteriores.map((item) =>
          item.id === imovel.id ? data : item
        )
      );

      cancelarEdicao();

      alert("Imóvel atualizado com sucesso!");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <main
      className="imoveis-page"
    >
      <style>
        {`
          .imoveis-page {
            box-sizing: border-box;
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px 24px;
          }

          .imoveis-card {
            box-sizing: border-box;
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px 28px;
            margin-top: 24px;
            background: #fff;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
          }

          .imoveis-section {
            width: 100%;
            border-top: 1px solid #e5e7eb;
            margin-top: 24px;
            padding-top: 22px;
          }

          .imoveis-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 24px;
            align-items: start;
            width: 100%;
          }

          .imoveis-field {
            display: block;
            min-width: 0;
            color: #374151;
            font-weight: 600;
            font-size: 14px;
          }

          .imoveis-field-full {
            grid-column: 1 / -1;
          }

          .imoveis-control {
            box-sizing: border-box;
            display: block;
            width: 100%;
            min-height: 44px;
            padding: 10px 12px;
            margin-top: 6px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            background: #fff;
          }

          .imoveis-textarea {
            min-height: 118px;
            resize: vertical;
          }

          @media (max-width: 700px) {
            .imoveis-page {
              padding: 24px 16px;
            }

            .imoveis-card {
              padding: 20px 16px;
            }

            .imoveis-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }

            .imoveis-field-full {
              grid-column: auto;
            }
          }
        `}
      </style>

      <h1 style={{ margin: 0 }}>Cadastro de Imóveis</h1>

      <div
        className="imoveis-card"
      >
        <h2 style={{ margin: 0 }}>Novo imóvel</h2>

        <SecaoFormulario titulo="Identificação">
          <CampoTexto
            label="Título"
            value={formCadastro.titulo}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("titulo", valorCampo)
            }
          />

          <CampoTexto
            label="Código"
            value={formCadastro.codigo}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("codigo", valorCampo)
            }
          />

          <CampoSelect
            label="Tipo"
            value={formCadastro.tipo}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("tipo", valorCampo)
            }
            opcoes={[
              ["apartamento", "Apartamento"],
              ["casa", "Casa"],
              ["sobrado", "Sobrado"],
              ["terreno", "Terreno"],
              ["comercial", "Comercial"],
              ["studio", "Studio"],
              ["outro", "Outro"],
            ]}
          />

          <CampoSelect
            label="Finalidade"
            value={formCadastro.finalidade}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("finalidade", valorCampo)
            }
            opcoes={[
              ["venda", "Venda"],
              ["locacao", "Locação"],
            ]}
          />

          <CampoSelect
            label="Status"
            value={formCadastro.status}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("status", valorCampo)
            }
            opcoes={[
              ["disponivel", "Disponível"],
              ["indisponivel", "Indisponível"],
              ["reservado", "Reservado"],
              ["vendido", "Vendido"],
              ["alugado", "Alugado"],
            ]}
          />

          <CampoTexto
            label="Categoria"
            value={formCadastro.categoria}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("categoria", valorCampo)
            }
          />

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <input
              type="checkbox"
              checked={formCadastro.destaque}
              onChange={(e) =>
                atualizarCampoCadastro("destaque", e.target.checked)
              }
            />
            Destaque
          </label>
        </SecaoFormulario>

        <SecaoFormulario titulo="Valores">
          <CampoTexto
            label="Valor"
            type="number"
            value={formCadastro.valor}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("valor", valorCampo)
            }
          />

          <CampoTexto
            label="Condomínio"
            type="number"
            value={formCadastro.condominio}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("condominio", valorCampo)
            }
          />

          <CampoTexto
            label="IPTU"
            type="number"
            value={formCadastro.iptu}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("iptu", valorCampo)
            }
          />
        </SecaoFormulario>

        <SecaoFormulario titulo="Localização">
          <CampoTexto
            label="CEP"
            value={formCadastro.cep}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("cep", valorCampo)
            }
          />

          <CampoTexto
            label="Endereço"
            value={formCadastro.endereco}
            full
            onChange={(valorCampo) =>
              atualizarCampoCadastro("endereco", valorCampo)
            }
          />

          <CampoTexto
            label="Número"
            value={formCadastro.numero}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("numero", valorCampo)
            }
          />

          <CampoTexto
            label="Bairro"
            value={formCadastro.bairro}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("bairro", valorCampo)
            }
          />

          <CampoTexto
            label="Cidade"
            value={formCadastro.cidade}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("cidade", valorCampo)
            }
          />

          <CampoTexto
            label="Estado"
            value={formCadastro.estado}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("estado", valorCampo)
            }
          />
        </SecaoFormulario>

        <SecaoFormulario titulo="Características">
          <CampoTexto
            label="Quartos"
            type="number"
            value={formCadastro.quartos}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("quartos", valorCampo)
            }
          />

          <CampoTexto
            label="Suítes"
            type="number"
            value={formCadastro.suites}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("suites", valorCampo)
            }
          />

          <CampoTexto
            label="Banheiros"
            type="number"
            value={formCadastro.banheiros}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("banheiros", valorCampo)
            }
          />

          <CampoTexto
            label="Vagas"
            type="number"
            value={formCadastro.vagas}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("vagas", valorCampo)
            }
          />

          <CampoTexto
            label="Área"
            type="number"
            value={formCadastro.area}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("area", valorCampo)
            }
          />

          <CampoTexto
            label="Área útil"
            type="number"
            value={formCadastro.area_util}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("area_util", valorCampo)
            }
          />

          <CampoTexto
            label="Área total"
            type="number"
            value={formCadastro.area_total}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("area_total", valorCampo)
            }
          />

          <CampoTexto
            label="Metragem"
            type="number"
            value={formCadastro.metragem}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("metragem", valorCampo)
            }
          />
        </SecaoFormulario>

        <SecaoFormulario titulo="Divulgação">
          <CampoArea
            label="Descrição"
            value={formCadastro.descricao}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("descricao", valorCampo)
            }
          />

          <CampoTexto
            label="Foto"
            value={formCadastro.foto}
            full
            onChange={(valorCampo) =>
              atualizarCampoCadastro("foto", valorCampo)
            }
          />

          <CampoTexto
            label="Link QuintoAndar"
            value={formCadastro.quintoandar}
            full
            onChange={(valorCampo) =>
              atualizarCampoCadastro("quintoandar", valorCampo)
            }
          />

          <CampoTexto
            label="Link Órulo"
            value={formCadastro.orulo}
            full
            onChange={(valorCampo) =>
              atualizarCampoCadastro("orulo", valorCampo)
            }
          />
        </SecaoFormulario>

        <SecaoFormulario titulo="Proprietário">
          <CampoTexto
            label="Proprietário"
            value={formCadastro.proprietario}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("proprietario", valorCampo)
            }
          />

          <CampoTexto
            label="Telefone"
            value={formCadastro.telefone}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("telefone", valorCampo)
            }
          />

          <CampoTexto
            label="Email"
            type="email"
            value={formCadastro.email}
            onChange={(valorCampo) =>
              atualizarCampoCadastro("email", valorCampo)
            }
          />
        </SecaoFormulario>

        <button
          onClick={salvar}
          disabled={salvando}
          style={{
            marginTop: 22,
            padding: "12px 22px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            cursor: salvando ? "wait" : "pointer",
          }}
        >
          {salvando ? "Salvando..." : "Salvar Imóvel"}
        </button>
      </div>

      <hr style={{ margin: "30px 0" }} />

      <h2>Meus imóveis</h2>

      {imoveis.length === 0 && (
        <p>Nenhum imóvel cadastrado.</p>
      )}

      {imoveis.map((imovel) => (
        <div
          key={imovel.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 10,
            padding: 18,
            marginBottom: 14,
            background: "#fff",
          }}
        >
          {editandoId === imovel.id ? (
            <div>
              <h3>Editar imóvel</h3>

              <SecaoFormulario titulo="Identificação">
                <CampoTexto
                  label="Título"
                  value={formEdicao.titulo}
                  onChange={(valorCampo) =>
                    atualizarCampo("titulo", valorCampo)
                  }
                />

                <CampoTexto
                  label="Código"
                  value={formEdicao.codigo}
                  onChange={(valorCampo) =>
                    atualizarCampo("codigo", valorCampo)
                  }
                />

                <CampoSelect
                  label="Tipo"
                  value={formEdicao.tipo}
                  onChange={(valorCampo) =>
                    atualizarCampo("tipo", valorCampo)
                  }
                  opcoes={[
                    ["apartamento", "Apartamento"],
                    ["casa", "Casa"],
                    ["sobrado", "Sobrado"],
                    ["terreno", "Terreno"],
                    ["comercial", "Comercial"],
                    ["studio", "Studio"],
                    ["outro", "Outro"],
                  ]}
                />

                <CampoSelect
                  label="Finalidade"
                  value={formEdicao.finalidade}
                  onChange={(valorCampo) =>
                    atualizarCampo("finalidade", valorCampo)
                  }
                  opcoes={[
                    ["venda", "Venda"],
                    ["locacao", "Locação"],
                  ]}
                />

                <CampoSelect
                  label="Status"
                  value={formEdicao.status}
                  onChange={(valorCampo) =>
                    atualizarCampo("status", valorCampo)
                  }
                  opcoes={[
                    ["disponivel", "Disponível"],
                    ["indisponivel", "Indisponível"],
                    ["reservado", "Reservado"],
                    ["vendido", "Vendido"],
                    ["alugado", "Alugado"],
                  ]}
                />

                <CampoTexto
                  label="Categoria"
                  value={formEdicao.categoria}
                  onChange={(valorCampo) =>
                    atualizarCampo("categoria", valorCampo)
                  }
                />
              </SecaoFormulario>

              <SecaoFormulario titulo="Valores">
                <CampoTexto
                  label="Valor"
                  type="number"
                  value={formEdicao.valor}
                  onChange={(valorCampo) =>
                    atualizarCampo("valor", valorCampo)
                  }
                />

                <CampoTexto
                  label="Condomínio"
                  type="number"
                  value={formEdicao.condominio}
                  onChange={(valorCampo) =>
                    atualizarCampo("condominio", valorCampo)
                  }
                />

                <CampoTexto
                  label="IPTU"
                  type="number"
                  value={formEdicao.iptu}
                  onChange={(valorCampo) =>
                    atualizarCampo("iptu", valorCampo)
                  }
                />
              </SecaoFormulario>

              <SecaoFormulario titulo="Localização">
                <CampoTexto
                  label="Bairro"
                  value={formEdicao.bairro}
                  onChange={(valorCampo) =>
                    atualizarCampo("bairro", valorCampo)
                  }
                />

                <CampoTexto
                  label="Cidade"
                  value={formEdicao.cidade}
                  onChange={(valorCampo) =>
                    atualizarCampo("cidade", valorCampo)
                  }
                />

                <CampoTexto
                  label="Estado"
                  value={formEdicao.estado}
                  onChange={(valorCampo) =>
                    atualizarCampo("estado", valorCampo)
                  }
                />

                <CampoTexto
                  label="CEP"
                  value={formEdicao.cep}
                  onChange={(valorCampo) =>
                    atualizarCampo("cep", valorCampo)
                  }
                />

                <CampoTexto
                  label="Endereço"
                  value={formEdicao.endereco}
                  full
                  onChange={(valorCampo) =>
                    atualizarCampo("endereco", valorCampo)
                  }
                />

                <CampoTexto
                  label="Número"
                  value={formEdicao.numero}
                  onChange={(valorCampo) =>
                    atualizarCampo("numero", valorCampo)
                  }
                />
              </SecaoFormulario>

              <SecaoFormulario titulo="Características">
                <CampoTexto
                  label="Quartos"
                  type="number"
                  value={formEdicao.quartos}
                  onChange={(valorCampo) =>
                    atualizarCampo("quartos", valorCampo)
                  }
                />

                <CampoTexto
                  label="Suítes"
                  type="number"
                  value={formEdicao.suites}
                  onChange={(valorCampo) =>
                    atualizarCampo("suites", valorCampo)
                  }
                />

                <CampoTexto
                  label="Banheiros"
                  type="number"
                  value={formEdicao.banheiros}
                  onChange={(valorCampo) =>
                    atualizarCampo("banheiros", valorCampo)
                  }
                />

                <CampoTexto
                  label="Vagas"
                  type="number"
                  value={formEdicao.vagas}
                  onChange={(valorCampo) =>
                    atualizarCampo("vagas", valorCampo)
                  }
                />

                <CampoTexto
                  label="Área"
                  type="number"
                  value={formEdicao.area}
                  onChange={(valorCampo) =>
                    atualizarCampo("area", valorCampo)
                  }
                />

                <CampoTexto
                  label="Área útil"
                  type="number"
                  value={formEdicao.area_util}
                  onChange={(valorCampo) =>
                    atualizarCampo("area_util", valorCampo)
                  }
                />

                <CampoTexto
                  label="Área total"
                  type="number"
                  value={formEdicao.area_total}
                  onChange={(valorCampo) =>
                    atualizarCampo("area_total", valorCampo)
                  }
                />

                <CampoTexto
                  label="Metragem"
                  type="number"
                  value={formEdicao.metragem}
                  onChange={(valorCampo) =>
                    atualizarCampo("metragem", valorCampo)
                  }
                />
              </SecaoFormulario>

              <SecaoFormulario titulo="Divulgação">
                <CampoArea
                  label="Descrição"
                  value={formEdicao.descricao}
                  onChange={(valorCampo) =>
                    atualizarCampo("descricao", valorCampo)
                  }
                />

                <CampoTexto
                  label="Foto"
                  value={formEdicao.foto}
                  full
                  onChange={(valorCampo) =>
                    atualizarCampo("foto", valorCampo)
                  }
                />

                <CampoTexto
                  label="Link QuintoAndar"
                  value={formEdicao.quintoandar}
                  full
                  onChange={(valorCampo) =>
                    atualizarCampo("quintoandar", valorCampo)
                  }
                />

                <CampoTexto
                  label="Link Órulo"
                  value={formEdicao.orulo}
                  full
                  onChange={(valorCampo) =>
                    atualizarCampo("orulo", valorCampo)
                  }
                />

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formEdicao.destaque}
                    onChange={(e) =>
                      atualizarCampo("destaque", e.target.checked)
                    }
                  />
                  Destaque
                </label>
              </SecaoFormulario>

              <SecaoFormulario titulo="Proprietário">
                <CampoTexto
                  label="Proprietário"
                  value={formEdicao.proprietario}
                  onChange={(valorCampo) =>
                    atualizarCampo("proprietario", valorCampo)
                  }
                />

                <CampoTexto
                  label="Telefone"
                  value={formEdicao.telefone}
                  onChange={(valorCampo) =>
                    atualizarCampo("telefone", valorCampo)
                  }
                />

                <CampoTexto
                  label="Email"
                  type="email"
                  value={formEdicao.email}
                  onChange={(valorCampo) =>
                    atualizarCampo("email", valorCampo)
                  }
                />
              </SecaoFormulario>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  onClick={() => salvarEdicao(imovel)}
                  disabled={salvandoEdicao}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: salvandoEdicao ? "wait" : "pointer",
                  }}
                >
                  {salvandoEdicao
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>

                <button
                  type="button"
                  onClick={cancelarEdicao}
                  disabled={salvandoEdicao}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>{imovel.titulo}</strong>

                  {imovel.codigo && (
                    <div style={{ color: "#666", marginTop: 4 }}>
                      Código: {imovel.codigo}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => preencherEdicao(imovel)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Editar
                </button>
              </div>

              <div style={{ marginTop: 10, color: "#374151" }}>
                {[imovel.tipo, imovel.finalidade]
                  .filter(Boolean)
                  .join(" • ")}
              </div>

              <div style={{ marginTop: 6, color: "#374151" }}>
                {[imovel.bairro, imovel.cidade, imovel.estado]
                  .filter(Boolean)
                  .join(" • ")}
              </div>

              <div style={{ marginTop: 6, fontWeight: 700 }}>
                {formatarValor(imovel.valor)}
              </div>

              <div style={{ marginTop: 6 }}>
                Status: {imovel.status || "Não informado"}
                {imovel.destaque ? " • Destaque" : ""}
              </div>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}

function SecaoFormulario({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="imoveis-section"
    >
      <h4
        style={{
          margin: "0 0 14px",
          color: "#111827",
          fontSize: 16,
          fontWeight: 800,
        }}
      >
        {titulo}
      </h4>

      <div
        className="imoveis-grid"
      >
        {children}
      </div>
    </section>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
  full = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  full?: boolean;
}) {
  return (
    <label className={`imoveis-field${full ? " imoveis-field-full" : ""}`}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="imoveis-control"
      />
    </label>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  opcoes: string[][];
}) {
  return (
    <label className="imoveis-field">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="imoveis-control"
      >
        {opcoes.map(([valorOpcao, rotulo]) => (
          <option key={valorOpcao} value={valorOpcao}>
            {rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}

function CampoArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="imoveis-field imoveis-field-full">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="imoveis-control imoveis-textarea"
      />
    </label>
  );
}
