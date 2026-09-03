import axios from "axios";

export interface EnderecoCEP {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export async function buscarCEP(cep: string) {
  const somenteNumeros = cep.replace(/\D/g, "");

  if (somenteNumeros.length !== 8) return null;

  const { data } = await axios.get<EnderecoCEP>(
    `https://viacep.com.br/ws/${somenteNumeros}/json/`
  );

  if ((data as any).erro) return null;

  return data;
}