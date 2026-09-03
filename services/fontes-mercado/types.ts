export interface FiltrosPesquisaMercado {
  finalidade: string;
  tipo: string;
  cidade: string;
  bairro: string;
  valorMin: string;
  valorMax: string;
  quartosMin: string;
  suitesMin: string;
  banheirosMin: string;
  vagasMin: string;
  areaMin: string;
}

export interface ImovelPesquisaMercado {
  id: string;
  titulo: string;
  codigo: string | null;
  tipo: string | null;
  finalidade: string | null;
  valor: number | null;
  condominio: number | null;
  iptu: number | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
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
  foto: string | null;
  quintoandar: string | null;
  orulo: string | null;
  destaque: boolean | null;
}

export interface ImovelMercadoNormalizado {
  fonte: string;
  origem: "interna" | "externa";
  id: string;
  titulo: string | null;
  urlOriginal: string | null;
  valor: number | null;
  valorM2: number | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  tipo: string | null;
  finalidade: string | null;
  area: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  condominio: number | null;
  iptu: number | null;
  fotoPrincipal: string | null;
}

export interface FonteMercado {
  id: string;
  nome: string;
  origem: "interna" | "externa";
  configurada: boolean;
  buscar: (
    filtros: FiltrosPesquisaMercado
  ) => Promise<ImovelPesquisaMercado[]>;
}
