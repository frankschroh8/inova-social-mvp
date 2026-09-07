import { supabase } from "@/lib/supabase";

export interface Imovel {
  id?: string;

  titulo: string;
  descricao?: string;

  categoria?: string;

  valor?: number;

  condominio?: number;

  iptu?: number;

  area_total?: number;

  area_util?: number;

  quartos?: number;

  suites?: number;

  banheiros?: number;

  vagas?: number;

  cep?: string;

  endereco?: string;

  numero?: string;

  bairro?: string;

  cidade?: string;

  estado?: string;

  proprietario?: string;

  telefone?: string;

  email?: string;

  destaque?: boolean;
}

export interface ImovelSelecao {
  id: string;
  titulo: string;
  codigo: string | null;
  bairro: string | null;
  cidade: string | null;
  endereco: string | null;
  numero: string | null;
  proprietario: string | null;
  status: string | null;
}

function sanitizarTermoBusca(termo: string) {
  return termo
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

export async function listarImoveis() {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function buscarImoveisParaSelecao(termo: string) {
  const termoBusca = sanitizarTermoBusca(termo);

  if (termoBusca.length < 2) {
    return [];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuario nao autenticado.");
  }

  const filtroTexto = [
    `codigo.ilike.%${termoBusca}%`,
    `titulo.ilike.%${termoBusca}%`,
    `bairro.ilike.%${termoBusca}%`,
    `endereco.ilike.%${termoBusca}%`,
    `proprietario.ilike.%${termoBusca}%`,
  ].join(",");

  const { data, error } = await supabase
    .from("imoveis")
    .select(
      "id, titulo, codigo, bairro, cidade, endereco, numero, proprietario, status"
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .eq("status", "disponivel")
    .or(filtroTexto)
    .order("titulo", { ascending: true })
    .limit(10);

  if (error) throw error;

  return (data || []) as ImovelSelecao[];
}

export async function buscarImovel(id: string) {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function criarImovel(imovel: Imovel) {
  const { data, error } = await supabase
    .from("imoveis")
    .insert(imovel)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function atualizarImovel(
  id: string,
  imovel: Partial<Imovel>
) {
  const { data, error } = await supabase
    .from("imoveis")
    .update(imovel)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function excluirImovel(id: string) {
  const { error } = await supabase
    .from("imoveis")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadImagem(file: File) {
  const nome = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("imoveis")
    .upload(nome, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("imoveis")
    .getPublicUrl(nome);

  return data.publicUrl;
}
