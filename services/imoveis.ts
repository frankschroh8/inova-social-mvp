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

export async function listarImoveis() {
  const { data, error } = await supabase
    .from("imoveis")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
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