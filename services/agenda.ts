import { supabase } from "@/lib/supabase";

export async function listarAgenda() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: clientes, error: clientesError } = await supabase
    .from("clientes")
    .select(`
      id,
      nome,
      telefone,
      status,
      observacoes,
      proximo_contato
    `)
    .eq("user_id", user.id)
    .not("proximo_contato", "is", null)
    .order("proximo_contato", { ascending: true });

  if (clientesError) {
    console.error("Erro ao carregar clientes da agenda:", clientesError);
  }

  const { data: compromissos, error: agendaError } = await supabase
    .from("agenda")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .neq("status", "concluido")
    .order("data_inicio", { ascending: true });

  if (agendaError) {
    console.error("Erro ao carregar compromissos:", agendaError);
  }

  const agendaClientes = (clientes || []).map((cliente) => ({
    id: `cliente-${cliente.id}`,
    cliente_id: cliente.id,
    titulo: cliente.nome,
    nome: cliente.nome,
    telefone: cliente.telefone,
    status: cliente.status,
    descricao: cliente.observacoes,
    data: cliente.proximo_contato,
    origem: "cliente",
  }));

  const agendaCompromissos = (compromissos || []).map((item) => ({
    id: item.id,
    cliente_id: item.cliente_id,
    titulo: item.titulo,
    nome: item.titulo,
    telefone: null,
    status: item.status,
    descricao: item.descricao,
    data: item.data_inicio,
    origem: "agenda",
  }));

  return [...agendaClientes, ...agendaCompromissos].sort(
    (a, b) =>
      new Date(a.data).getTime() -
      new Date(b.data).getTime()
  );
}

export async function criarCompromisso(compromisso: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data, error } = await supabase
    .from("agenda")
    .insert({
      ...compromisso,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating appointment:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    throw new Error(
      `Error creating appointment: ${error.message}`
    );
  }

  return data;
}

export async function concluirCompromisso(compromissoId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data, error } = await supabase
    .from("agenda")
    .update({
      status: "concluido",
      updated_at: new Date().toISOString(),
    })
    .eq("id", compromissoId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error completing appointment: ${error.message}`
    );
  }

  return data;
}

export async function reagendarCompromisso(
  compromissoId: string,
  novaData: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data, error } = await supabase
    .from("agenda")
    .update({
      data_inicio: new Date(novaData).toISOString(),
      status: "agendado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", compromissoId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error rescheduling appointment: ${error.message}`
    );
  }

  return data;
}

export async function listarClientesParaAgenda() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data, error } = await supabase
    .from("clientes")
    .select(`
      id,
      nome,
      telefone
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Error loading clients for agenda:", error);

    throw new Error(
      `Error loading clients: ${error.message}`
    );
  }

  return data || [];
}