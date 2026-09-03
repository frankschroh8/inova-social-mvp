"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { criarCompromisso } from "@/services/agenda";

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  interesse: string | null;
  finalidade: string | null;
  bairro: string | null;
  cidade: string | null;
  valor_min: number | null;
  valor: number | null;
  quartos_min: number | null;
  suites_min: number | null;
  banheiros_min: number | null;
  vagas_min: number | null;
  area_min: number | null;
  observacoes: string | null;
  status: string | null;
  ultimo_contato: string | null;
  proximo_contato: string | null;
  profissao: string | null;
  renda: number | null;
  estado_civil: string | null;
  filhos: number | null;
}

interface Match {
  id: string;
  nome: string;
  score: number;
  pontosObtidos?: number;
  pontosPossiveis?: number;
  detalhesScore?: DetalheScore[];
  bairro?: string | null;
  cidade?: string | null;
  endereco?: string | null;
  numero?: string | null;
}

type StatusDetalheScore =
  | "atende"
  | "parcial"
  | "nao_atende"
  | "desconhecido";

interface DetalheScore {
  criterio: string;
  label: string;
  status: StatusDetalheScore;
  pontos: number;
  pontosPossiveis: number;
  descricao: string;
}

interface Historico {
  id: string;
  tipo: string | null;
  descricao: string | null;
  created_at: string;
}

type EstagioInteresse =
  | "interessado"
  | "visita_agendada"
  | "proposta"
  | "sem_interesse";

const ESTAGIOS_INTERESSE: {
  valor: EstagioInteresse;
  rotulo: string;
  cor: string;
}[] = [
  {
    valor: "interessado",
    rotulo: "Interessado",
    cor: "#2563eb",
  },
  {
    valor: "visita_agendada",
    rotulo: "Visita agendada",
    cor: "#d97706",
  },
  {
    valor: "proposta",
    rotulo: "Proposta",
    cor: "#7c3aed",
  },
  {
    valor: "sem_interesse",
    rotulo: "Sem interesse",
    cor: "#6b7280",
  },
];

export default function ClienteDetalhesPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [carregandoMatch, setCarregandoMatch] = useState(false);
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [salvandoEstagio, setSalvandoEstagio] = useState<string | null>(
    null
  );

  const [erro, setErro] = useState("");

  const [editando, setEditando] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [origem, setOrigem] = useState("");
  const [interesse, setInteresse] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [valorMin, setValorMin] = useState("");
  const [valor, setValor] = useState("");
  const [quartosMin, setQuartosMin] = useState("");
  const [suitesMin, setSuitesMin] = useState("");
  const [banheirosMin, setBanheirosMin] = useState("");
  const [vagasMin, setVagasMin] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [status, setStatus] = useState("");
  const [profissao, setProfissao] = useState("");
  const [renda, setRenda] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [filhos, setFilhos] = useState("");
  const [proximoContatoEdicao, setProximoContatoEdicao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [descricaoContato, setDescricaoContato] = useState("");
  const [proximoContato, setProximoContato] = useState("");
  const [visitaAgendada, setVisitaAgendada] = useState<{
    matchId: string;
    data: string;
    hora: string;
    observacao: string;
  } | null>(null);

  useEffect(() => {
    carregarCliente();
  }, []);

  function valorDataHoraLocal(data: string | null) {
    if (!data) return "";

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
      return "";
    }

    const offset = dataConvertida.getTimezoneOffset();
    const local = new Date(dataConvertida.getTime() - offset * 60000);

    return local.toISOString().slice(0, 16);
  }

  function numeroOuNull(valorCampo: string) {
    return valorCampo ? Number(valorCampo) : null;
  }

  function formatarMoeda(valorCampo: number | null) {
    if (valorCampo === null || valorCampo === undefined) {
      return null;
    }

    return Number(valorCampo).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  }

  function formatarFaixaDePreco() {
    const minimo = formatarMoeda(cliente?.valor_min ?? null);
    const maximo = formatarMoeda(cliente?.valor ?? null);

    if (minimo && maximo) {
      return `${minimo} a ${maximo}`;
    }

    if (minimo) {
      return `A partir de ${minimo}`;
    }

    if (maximo) {
      return `Até ${maximo}`;
    }

    return null;
  }

  function temPreferenciasImovel() {
    if (!cliente) return false;

    return Boolean(
      cliente.valor_min !== null ||
        cliente.valor !== null ||
        cliente.quartos_min !== null ||
        cliente.suites_min !== null ||
        cliente.banheiros_min !== null ||
        cliente.vagas_min !== null ||
        cliente.area_min !== null
    );
  }

  function preencherFormularioCliente(dados: Cliente) {
    setNome(dados.nome || "");
    setTelefone(dados.telefone || "");
    setEmail(dados.email || "");
    setOrigem(dados.origem || "");
    setInteresse(dados.interesse || "");
    setFinalidade(dados.finalidade || "");
    setBairro(dados.bairro || "");
    setCidade(dados.cidade || "");
    setValorMin(dados.valor_min ? String(dados.valor_min) : "");
    setValor(dados.valor ? String(dados.valor) : "");
    setQuartosMin(
      dados.quartos_min !== null && dados.quartos_min !== undefined
        ? String(dados.quartos_min)
        : ""
    );
    setSuitesMin(
      dados.suites_min !== null && dados.suites_min !== undefined
        ? String(dados.suites_min)
        : ""
    );
    setBanheirosMin(
      dados.banheiros_min !== null && dados.banheiros_min !== undefined
        ? String(dados.banheiros_min)
        : ""
    );
    setVagasMin(
      dados.vagas_min !== null && dados.vagas_min !== undefined
        ? String(dados.vagas_min)
        : ""
    );
    setAreaMin(
      dados.area_min !== null && dados.area_min !== undefined
        ? String(dados.area_min)
        : ""
    );
    setStatus(dados.status || "");
    setProfissao(dados.profissao || "");
    setRenda(dados.renda ? String(dados.renda) : "");
    setEstadoCivil(dados.estado_civil || "");
    setFilhos(
      dados.filhos !== null && dados.filhos !== undefined
        ? String(dados.filhos)
        : ""
    );
    setProximoContatoEdicao(valorDataHoraLocal(dados.proximo_contato));
    setObservacoes(dados.observacoes || "");
  }

  async function carregarCliente() {
    try {
      const caminho =
        window.location.pathname.split("/clientes/")[1];

      const clienteId = caminho?.split("/")[0];

      if (!clienteId) {
        setErro("ID do cliente não encontrado.");
        setCarregando(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErro("Usuário não está logado.");
        setCarregando(false);
        return;
      }

      const { data, error } = await supabase
        .from("clientes")
        .select(`
          id,
          nome,
          telefone,
          email,
          origem,
          interesse,
          finalidade,
          bairro,
          cidade,
          valor_min,
          valor,
          quartos_min,
          suites_min,
          banheiros_min,
          vagas_min,
          area_min,
          observacoes,
          status,
          ultimo_contato,
          proximo_contato,
          profissao,
          renda,
          estado_civil,
          filhos
        `)
        .eq("id", clienteId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Erro ao buscar cliente:", error);
        setErro("Cliente não encontrado.");
        setCarregando(false);
        return;
      }

      setCliente(data);

      preencherFormularioCliente(data);

      await carregarHistorico(clienteId);

      setCarregando(false);
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar cliente.");
      setCarregando(false);
    }
  }

  async function carregarHistorico(clienteId: string) {
    const { data, error } = await supabase
      .from("historico")
      .select(`
        id,
        tipo,
        descricao,
        created_at
      `)
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar histórico:", error);
      return;
    }

    setHistorico(data || []);
  }

  async function salvarCliente() {
    if (!cliente) return;

    if (!nome.trim()) {
      alert("Digite o nome do cliente.");
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

    if (renda && Number(renda) < 0) {
      alert("Informe uma renda válida.");
      return;
    }

    if (filhos && Number(filhos) < 0) {
      alert("Informe uma quantidade de filhos válida.");
      return;
    }

    setSalvandoCliente(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Usuário não está logado.");
        return;
      }

      const { data, error } = await supabase
        .from("clientes")
        .update({
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          email: email.trim() || null,
          origem: origem.trim() || null,
          interesse: interesse.trim() || null,
          finalidade: finalidade.trim() || null,
          bairro: bairro.trim() || null,
          cidade: cidade.trim() || null,
          valor_min: numeroOuNull(valorMin),
          valor: numeroOuNull(valor),
          quartos_min: numeroOuNull(quartosMin),
          suites_min: numeroOuNull(suitesMin),
          banheiros_min: numeroOuNull(banheirosMin),
          vagas_min: numeroOuNull(vagasMin),
          area_min: numeroOuNull(areaMin),
          status: status.trim() || null,
          profissao: profissao.trim() || null,
          renda: renda ? Number(renda) : null,
          estado_civil: estadoCivil.trim() || null,
          filhos: filhos ? Number(filhos) : null,
          proximo_contato: proximoContatoEdicao
            ? new Date(proximoContatoEdicao).toISOString()
            : null,
          observacoes: observacoes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cliente.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar cliente:", error);
        alert(`Erro ao salvar cliente: ${error.message}`);
        return;
      }

      const { error: historicoError } = await supabase
        .from("historico")
        .insert({
          cliente_id: cliente.id,
          usuario_id: user.id,
          tipo: "cliente_editado",
          descricao: "Dados do cliente foram atualizados.",
        });

      if (historicoError) {
        console.error(
          "Erro ao registrar edição no histórico:",
          historicoError
        );

        alert(
          `Cliente atualizado, mas houve erro ao registrar histórico: ${historicoError.message}`
        );
      }

      setCliente(data);
      preencherFormularioCliente(data);
      setEditando(false);
      await carregarHistorico(cliente.id);

      alert("Cliente atualizado com sucesso!");

      setMatches([]);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao salvar cliente."
      );
    } finally {
      setSalvandoCliente(false);
    }
  }

  async function encontrarImoveis() {
    if (!cliente) return;

    setCarregandoMatch(true);

    try {
      const response = await fetch(
        `/api/match?clienteId=${cliente.id}`
      );

      const resultado = await response.json();

      if (!response.ok || !resultado.sucesso) {
        throw new Error(
          resultado.erro || "Erro ao buscar imóveis."
        );
      }

      setMatches(resultado.matches || []);

      await carregarHistorico(cliente.id);
    } catch (error) {
      console.error("Erro no Match:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao encontrar imóveis."
      );
    } finally {
      setCarregandoMatch(false);
    }
  }

  async function registrarContato() {
    if (!cliente) return;

    if (!descricaoContato.trim()) {
      alert("Digite uma observação sobre o contato.");
      return;
    }

    setSalvandoContato(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Usuário não está logado.");
        return;
      }

      const agora = new Date().toISOString();

      const { error: historicoError } = await supabase
        .from("historico")
        .insert({
          cliente_id: cliente.id,
          usuario_id: user.id,
          tipo: "contato",
          descricao: descricaoContato.trim(),
        });

      if (historicoError) {
        console.error(
          "Erro ao registrar histórico:",
          historicoError
        );

        alert(
          `Erro ao registrar contato: ${historicoError.message}`
        );

        return;
      }

      const { error: clienteError } = await supabase
        .from("clientes")
        .update({
          ultimo_contato: agora,
          proximo_contato: proximoContato
            ? new Date(proximoContato).toISOString()
            : null,
        })
        .eq("id", cliente.id)
        .eq("user_id", user.id);

      if (clienteError) {
        console.error(
          "Erro ao atualizar cliente:",
          clienteError
        );

        alert(
          `Contato salvo, mas houve erro ao atualizar a data: ${clienteError.message}`
        );

        return;
      }

      setDescricaoContato("");
      setProximoContato("");

      await carregarHistorico(cliente.id);
      await carregarCliente();

      alert("Contato registrado com sucesso!");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao registrar contato."
      );
    } finally {
      setSalvandoContato(false);
    }
  }

  function rotuloEstagioInteresse(estagio: EstagioInteresse) {
    return (
      ESTAGIOS_INTERESSE.find((opcao) => opcao.valor === estagio)
        ?.rotulo || estagio
    );
  }

  function corEstagioInteresse(estagio: EstagioInteresse) {
    return (
      ESTAGIOS_INTERESSE.find((opcao) => opcao.valor === estagio)
        ?.cor || "#6b7280"
    );
  }

  function obterEstagioAtual(imovelId: string) {
    const registro = historico.find((item) => {
      if (item.tipo !== "interesse_imovel" || !item.descricao) {
        return false;
      }

      return item.descricao.includes(`ID do imóvel: ${imovelId}`);
    });

    if (!registro?.descricao) {
      return null;
    }

    const encontrado = registro.descricao.match(
      /Estágio: (interessado|visita_agendada|proposta|sem_interesse)/
    );

    return (encontrado?.[1] as EstagioInteresse | undefined) || null;
  }

  function formatarEnderecoImovel(match: Match) {
    const rua = [match.endereco, match.numero]
      .filter(Boolean)
      .join(", ");

    const localizacao = [match.bairro, match.cidade]
      .filter(Boolean)
      .join(" - ");

    return [rua, localizacao].filter(Boolean).join(" | ");
  }

  async function registrarEstagioInteresse(
    match: Match,
    estagio: EstagioInteresse,
    detalhes: string[] = []
  ) {
    if (!cliente) return;

    setSalvandoEstagio(`${match.id}:${estagio}`);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Usuário não está logado.");
        return;
      }

      const descricao = [
        `Estágio: ${estagio}`,
        `Status: ${rotuloEstagioInteresse(estagio)}`,
        `Imóvel: ${match.nome}`,
        `ID do imóvel: ${match.id}`,
        `Score: ${match.score}%`,
        ...detalhes,
        `Alterado em: ${new Date().toLocaleString("pt-BR")}`,
      ].join("\n");

      const { error } = await supabase.from("historico").insert({
        cliente_id: cliente.id,
        usuario_id: user.id,
        tipo: "interesse_imovel",
        descricao,
      });

      if (error) {
        console.error(
          "Erro ao registrar estágio do imóvel:",
          error
        );

        alert(
          `Erro ao registrar estágio do imóvel: ${error.message}`
        );

        return;
      }

      await carregarHistorico(cliente.id);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao registrar estágio do imóvel."
      );
    } finally {
      setSalvandoEstagio(null);
    }
  }

  function iniciarAgendamentoVisita(match: Match) {
    setVisitaAgendada({
      matchId: match.id,
      data: "",
      hora: "",
      observacao: "",
    });
  }

  async function salvarAgendamentoVisita(match: Match) {
    if (!cliente || !visitaAgendada) return;

    if (!visitaAgendada.data) {
      alert("Informe a data da visita.");
      return;
    }

    if (!visitaAgendada.hora) {
      alert("Informe o horário da visita.");
      return;
    }

    const dataInicio = new Date(
      `${visitaAgendada.data}T${visitaAgendada.hora}`
    );

    if (Number.isNaN(dataInicio.getTime())) {
      alert("Informe uma data e horário válidos.");
      return;
    }

    setSalvandoEstagio(`${match.id}:visita_agendada`);

    try {
      const endereco = formatarEnderecoImovel(match);
      const dataHoraFormatada = dataInicio.toLocaleString("pt-BR");

      await criarCompromisso({
        cliente_id: cliente.id,
        titulo: `Visita - ${cliente.nome} - ${match.nome}`,
        descricao: [
          `Cliente: ${cliente.nome}`,
          `Imóvel: ${match.nome}`,
          `ID do imóvel: ${match.id}`,
          `Data e horário: ${dataHoraFormatada}`,
          endereco ? `Endereço: ${endereco}` : "",
          visitaAgendada.observacao.trim()
            ? `Observação: ${visitaAgendada.observacao.trim()}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        data_inicio: dataInicio.toISOString(),
        status: "agendado",
      });

      await registrarEstagioInteresse(match, "visita_agendada", [
        `Visita agendada para: ${dataHoraFormatada}`,
        endereco ? `Endereço: ${endereco}` : "",
        visitaAgendada.observacao.trim()
          ? `Observação: ${visitaAgendada.observacao.trim()}`
          : "",
      ].filter(Boolean));

      setVisitaAgendada(null);

      alert("Visita agendada com sucesso!");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao agendar visita."
      );

      setSalvandoEstagio(null);
    }
  }

  if (carregando) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Carregando cliente...</h1>
      </main>
    );
  }

  if (erro || !cliente) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Cliente</h1>
        <p>{erro || "Cliente não encontrado."}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <button
        onClick={() => window.history.back()}
        style={{
          padding: "8px 14px",
          marginBottom: 20,
        }}
      >
        ← Voltar
      </button>

      <h1>{cliente.nome}</h1>

      {/* DADOS DO CLIENTE */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 25,
          marginTop: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Dados do cliente</h2>

          {!editando && (
            <button
              onClick={() => setEditando(true)}
              style={{
                padding: "10px 18px",
              }}
            >
              ✏️ Editar cliente
            </button>
          )}
        </div>

        {editando ? (
          <div style={{ marginTop: 20 }}>
            <h3>Dados básicos</h3>

            <label>Nome</label>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Telefone</label>

            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>E-mail</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Origem</label>

            <input
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              placeholder="Ex.: indicação, site, WhatsApp"
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <h3
              style={{
                marginTop: 25,
                paddingTop: 18,
                borderTop: "1px solid #eee",
              }}
            >
              Interesse imobiliário
            </h3>

            <label>Interesse</label>

            <input
              value={interesse}
              onChange={(e) => setInteresse(e.target.value)}
              placeholder="Ex.: apartamento"
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Finalidade</label>

            <select
              value={finalidade}
              onChange={(e) => setFinalidade(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            >
              <option value="">Selecione</option>
              <option value="venda">Compra</option>
              <option value="locacao">Locação</option>
            </select>

            <label>Bairro</label>

            <input
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex.: Batel"
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Cidade</label>

            <input
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex.: Curitiba"
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Valor máximo</label>

            <input
              type="number"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex.: 550000"
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <h3
              style={{
                marginTop: 25,
                paddingTop: 18,
                borderTop: "1px solid #eee",
              }}
            >
              Perfil
            </h3>

            <label>Profissão</label>

            <input
              value={profissao}
              onChange={(e) => setProfissao(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Renda</label>

            <input
              type="number"
              value={renda}
              onChange={(e) => setRenda(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Estado civil</label>

            <input
              value={estadoCivil}
              onChange={(e) => setEstadoCivil(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Filhos</label>

            <input
              type="number"
              min="0"
              value={filhos}
              onChange={(e) => setFilhos(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <h3
              style={{
                marginTop: 25,
                paddingTop: 18,
                borderTop: "1px solid #eee",
              }}
            >
              Preferências do imóvel
            </h3>

            <label>Valor mínimo</label>

            <input
              type="number"
              min="0"
              value={valorMin}
              onChange={(e) => setValorMin(e.target.value)}
              placeholder="Ex.: 500000"
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Quartos mínimos</label>

            <input
              type="number"
              min="0"
              value={quartosMin}
              onChange={(e) => setQuartosMin(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Suítes mínimas</label>

            <input
              type="number"
              min="0"
              value={suitesMin}
              onChange={(e) => setSuitesMin(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Banheiros mínimos</label>

            <input
              type="number"
              min="0"
              value={banheirosMin}
              onChange={(e) => setBanheirosMin(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Vagas mínimas</label>

            <input
              type="number"
              min="0"
              value={vagasMin}
              onChange={(e) => setVagasMin(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Área mínima</label>

            <input
              type="number"
              min="0"
              value={areaMin}
              onChange={(e) => setAreaMin(e.target.value)}
              placeholder="Ex.: 90"
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <h3
              style={{
                marginTop: 25,
                paddingTop: 18,
                borderTop: "1px solid #eee",
              }}
            >
              Atendimento
            </h3>

            <label>Status</label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            >
              <option value="">Selecione</option>
              <option value="Novo">Novo</option>
              <option value="Em atendimento">Em atendimento</option>
              <option value="Negociação">Negociação</option>
              <option value="Proposta">Proposta</option>
              <option value="Cliente">Cliente</option>
              <option value="Fechado">Fechado</option>
              <option value="Inativo">Inativo</option>
            </select>

            <label>Próximo contato</label>

            <input
              type="datetime-local"
              value={proximoContatoEdicao}
              onChange={(e) =>
                setProximoContatoEdicao(e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <label>Observações</label>

            <textarea
              value={observacoes}
              onChange={(e) =>
                setObservacoes(e.target.value)
              }
              style={{
                display: "block",
                width: "100%",
                minHeight: 100,
                padding: 10,
                marginTop: 5,
                marginBottom: 15,
              }}
            />

            <button
              onClick={salvarCliente}
              disabled={salvandoCliente}
              style={{
                padding: "12px 20px",
                marginRight: 10,
              }}
            >
              {salvandoCliente
                ? "Salvando..."
                : "💾 Salvar alterações"}
            </button>

            <button
              onClick={() => {
                setEditando(false);
                preencherFormularioCliente(cliente);
              }}
              disabled={salvandoCliente}
              style={{
                padding: "12px 20px",
              }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <p>
              📞 <strong>Telefone:</strong>{" "}
              {cliente.telefone || "Não informado"}
            </p>

            <p>
              ✉️ <strong>E-mail:</strong>{" "}
              {cliente.email || "Não informado"}
            </p>

            <p>
              🔎 <strong>Origem:</strong>{" "}
              {cliente.origem || "Não informada"}
            </p>

            <p>
              🏠 <strong>Interesse:</strong>{" "}
              {cliente.interesse || "Não informado"}
            </p>

            <p>
              🎯 <strong>Finalidade:</strong>{" "}
              {cliente.finalidade === "venda"
                ? "Compra"
                : cliente.finalidade === "locacao"
                  ? "Locação"
                  : cliente.finalidade || "Não informada"}
            </p>

            <p>
              📍 <strong>Bairro:</strong>{" "}
              {cliente.bairro || "Não informado"}
            </p>

            <p>
              🌎 <strong>Cidade:</strong>{" "}
              {cliente.cidade || "Não informado"}
            </p>

            <p>
              💰 <strong>Valor:</strong>{" "}
              {cliente.valor
                ? `Até R$ ${Number(
                    cliente.valor
                  ).toLocaleString("pt-BR")}`
                : "Não informado"}
            </p>

            {temPreferenciasImovel() && (
              <div
                style={{
                  borderTop: "1px solid #eee",
                  marginTop: 18,
                  paddingTop: 18,
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Preferências do imóvel
                </h3>

                {formatarFaixaDePreco() && (
                  <p>
                    <strong>Faixa de preço:</strong>{" "}
                    {formatarFaixaDePreco()}
                  </p>
                )}

                {cliente.quartos_min !== null && (
                  <p>
                    <strong>Quartos:</strong> mínimo{" "}
                    {cliente.quartos_min}
                  </p>
                )}

                {cliente.suites_min !== null && (
                  <p>
                    <strong>Suítes:</strong> mínimo{" "}
                    {cliente.suites_min}
                  </p>
                )}

                {cliente.banheiros_min !== null && (
                  <p>
                    <strong>Banheiros:</strong> mínimo{" "}
                    {cliente.banheiros_min}
                  </p>
                )}

                {cliente.vagas_min !== null && (
                  <p>
                    <strong>Vagas:</strong> mínimo{" "}
                    {cliente.vagas_min}
                  </p>
                )}

                {cliente.area_min !== null && (
                  <p>
                    <strong>Área:</strong> mínimo{" "}
                    {cliente.area_min} m²
                  </p>
                )}
              </div>
            )}

            <p>
              🔄 <strong>Status:</strong>{" "}
              {cliente.status || "Não informado"}
            </p>

            <p>
              💼 <strong>Profissão:</strong>{" "}
              {cliente.profissao || "Não informada"}
            </p>

            <p>
              💵 <strong>Renda:</strong>{" "}
              {cliente.renda
                ? Number(cliente.renda).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  })
                : "Não informada"}
            </p>

            <p>
              💍 <strong>Estado civil:</strong>{" "}
              {cliente.estado_civil || "Não informado"}
            </p>

            <p>
              👨‍👩‍👧‍👦 <strong>Filhos:</strong>{" "}
              {cliente.filhos !== null &&
              cliente.filhos !== undefined
                ? cliente.filhos
                : "Não informado"}
            </p>

            {cliente.observacoes && (
              <p>
                📝 <strong>Observações:</strong>{" "}
                {cliente.observacoes}
              </p>
            )}
          </>
        )}
      </section>

      {/* MATCH */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 25,
          marginTop: 25,
        }}
      >
        <h2>🎯 Match de imóveis</h2>

        <button
          onClick={encontrarImoveis}
          disabled={carregandoMatch}
          style={{
            padding: "12px 20px",
            fontSize: 16,
          }}
        >
          {carregandoMatch
            ? "🔎 Procurando imóveis..."
            : "🎯 Encontrar imóveis"}
        </button>

        {matches.length > 0 &&
          matches.map((match) => {
            const estagioAtual = obterEstagioAtual(match.id);

            return (
            <div
              key={match.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 18,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ marginTop: 0 }}>{match.nome}</h3>

                {estagioAtual && (
                  <span
                    style={{
                      background: corEstagioInteresse(estagioAtual),
                      color: "#fff",
                      borderRadius: 20,
                      padding: "6px 10px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {rotuloEstagioInteresse(estagioAtual)}
                  </span>
                )}
              </div>

              <strong style={{ fontSize: 18 }}>
                🎯 {match.score}% de compatibilidade
              </strong>

              <DetalhesCompatibilidade match={match} />

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 15,
                }}
              >
                {ESTAGIOS_INTERESSE.map((opcao) => {
                  const selecionado = estagioAtual === opcao.valor;
                  const salvando =
                    salvandoEstagio === `${match.id}:${opcao.valor}`;

                  return (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => {
                        if (opcao.valor === "visita_agendada") {
                          iniciarAgendamentoVisita(match);
                          return;
                        }

                        registrarEstagioInteresse(
                          match,
                          opcao.valor
                        );
                      }}
                      disabled={salvandoEstagio !== null}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: selecionado
                          ? "none"
                          : "1px solid #d1d5db",
                        background: selecionado ? opcao.cor : "#fff",
                        color: selecionado ? "#fff" : "#111827",
                        fontWeight: 600,
                        cursor:
                          salvandoEstagio !== null
                            ? "wait"
                            : "pointer",
                      }}
                    >
                      {salvando ? "Salvando..." : opcao.rotulo}
                    </button>
                  );
                })}
              </div>

              {visitaAgendada?.matchId === match.id && (
                <div
                  style={{
                    marginTop: 15,
                    padding: 15,
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    background: "#f9fafb",
                  }}
                >
                  <strong>Agendar visita</strong>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <label>
                      Data
                      <input
                        type="date"
                        value={visitaAgendada.data}
                        onChange={(e) =>
                          setVisitaAgendada({
                            ...visitaAgendada,
                            data: e.target.value,
                          })
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          padding: 10,
                          marginTop: 5,
                        }}
                      />
                    </label>

                    <label>
                      Horário
                      <input
                        type="time"
                        value={visitaAgendada.hora}
                        onChange={(e) =>
                          setVisitaAgendada({
                            ...visitaAgendada,
                            hora: e.target.value,
                          })
                        }
                        style={{
                          display: "block",
                          width: "100%",
                          padding: 10,
                          marginTop: 5,
                        }}
                      />
                    </label>
                  </div>

                  <label
                    style={{
                      display: "block",
                      marginTop: 12,
                    }}
                  >
                    Observação
                    <textarea
                      value={visitaAgendada.observacao}
                      onChange={(e) =>
                        setVisitaAgendada({
                          ...visitaAgendada,
                          observacao: e.target.value,
                        })
                      }
                      placeholder="Observação opcional"
                      rows={3}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: 10,
                        marginTop: 5,
                      }}
                    />
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => salvarAgendamentoVisita(match)}
                      disabled={salvandoEstagio !== null}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: "#111827",
                        color: "#fff",
                        fontWeight: 600,
                        cursor:
                          salvandoEstagio !== null
                            ? "wait"
                            : "pointer",
                      }}
                    >
                      {salvandoEstagio ===
                      `${match.id}:visita_agendada`
                        ? "Salvando..."
                        : "Confirmar visita"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVisitaAgendada(null)}
                      disabled={salvandoEstagio !== null}
                      style={{
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        color: "#111827",
                        fontWeight: 600,
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}

        {matches.length === 0 && !carregandoMatch && (
          <p style={{ marginTop: 20 }}>
            Nenhum Match carregado. Clique no botão acima.
          </p>
        )}
      </section>

      {/* REGISTRAR CONTATO */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 25,
          marginTop: 25,
        }}
      >
        <h2>📞 Registrar contato</h2>

        <textarea
          placeholder="O que foi conversado com o cliente?"
          value={descricaoContato}
          onChange={(e) =>
            setDescricaoContato(e.target.value)
          }
          style={{
            width: "100%",
            minHeight: 100,
            padding: 10,
            marginTop: 10,
          }}
        />

        <label
          style={{
            display: "block",
            marginTop: 15,
            marginBottom: 5,
          }}
        >
          📅 Próximo contato
        </label>

        <input
          type="datetime-local"
          value={proximoContato}
          onChange={(e) =>
            setProximoContato(e.target.value)
          }
          style={{
            padding: 10,
          }}
        />

        <br />

        <button
          onClick={registrarContato}
          disabled={salvandoContato}
          style={{
            marginTop: 15,
            padding: "10px 20px",
          }}
        >
          {salvandoContato
            ? "Salvando..."
            : "Salvar contato"}
        </button>
      </section>

      {/* HISTÓRICO */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 25,
          marginTop: 25,
        }}
      >
        <h2>📝 Histórico</h2>

        {historico.length === 0 ? (
          <p>Nenhum contato registrado ainda.</p>
        ) : (
          historico.map((item) => (
            <div
              key={item.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "15px 0",
              }}
            >
              <strong>
                {item.tipo || "Contato"}
              </strong>

              <div style={{ marginTop: 5 }}>
                {item.descricao}
              </div>

              <small>
                {new Date(
                  item.created_at
                ).toLocaleString("pt-BR")}
              </small>
            </div>
          ))
        )}
      </section>

      {/* PRÓXIMO CONTATO */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 25,
          marginTop: 25,
        }}
      >
        <h2>📅 Próximo contato</h2>

        <p>
          {cliente.proximo_contato
            ? new Date(
                cliente.proximo_contato
              ).toLocaleString("pt-BR")
            : "Nenhum contato agendado."}
        </p>
      </section>
    </main>
  );
}

function DetalhesCompatibilidade({
  match,
}: {
  match: Match;
}) {
  if (!match.detalhesScore || match.detalhesScore.length === 0) {
    return null;
  }

  const cores: Record<StatusDetalheScore, string> = {
    atende: "#166534",
    parcial: "#92400e",
    nao_atende: "#991b1b",
    desconhecido: "#4b5563",
  };

  const icones: Record<StatusDetalheScore, string> = {
    atende: "✓",
    parcial: "!",
    nao_atende: "x",
    desconhecido: "?",
  };

  return (
    <details
      style={{
        marginTop: 14,
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
        background: "#f9fafb",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Ver compatibilidade
      </summary>

      {match.pontosPossiveis !== undefined &&
        match.pontosPossiveis > 0 && (
          <div
            style={{
              marginTop: 10,
              color: "#4b5563",
              fontSize: 14,
            }}
          >
            Pontuação: {match.pontosObtidos} de{" "}
            {match.pontosPossiveis} pontos possíveis
          </div>
        )}

      <div
        style={{
          display: "grid",
          gap: 8,
          marginTop: 10,
        }}
      >
        {match.detalhesScore.map((detalhe) => (
          <div
            key={detalhe.criterio}
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr auto",
              gap: 8,
              alignItems: "start",
              fontSize: 14,
            }}
          >
            <span style={{ color: cores[detalhe.status], fontWeight: 800 }}>
              {icones[detalhe.status]}
            </span>

            <span>
              <strong>{detalhe.label}:</strong>{" "}
              {detalhe.descricao}
            </span>

            <span style={{ color: "#6b7280", whiteSpace: "nowrap" }}>
              {detalhe.pontos}/{detalhe.pontosPossiveis}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
