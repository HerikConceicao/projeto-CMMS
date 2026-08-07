export interface Setor {
  id: number;
  name: string;
  count: number;
}

export interface TipoEquipamento {
  id: number;
  name: string;
  count: number;
}

export interface Fabricante {
  id: number;
  name: string;
  modelCount: number;
  count: number;
}

export interface Modelo {
  id: number;
  name: string;
  manufacturerId: number;
}

export interface Funcao {
  id: number;
  name: string;
  count: number;
}

export interface TipoProblema {
  id: number;
  name: string;
  count: number;
}
