export type AssetCriticality = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type AssetStatus = 'pending' | 'active' | 'maintenance' | 'decommissioned';

export interface Asset {
  id: number;
  name: string;
  sector: string;
  assetNumber: string; // Ex: PAT-0892 ou Tag de Inventário
  reportedBy?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  locationDetails?: string;
  criticality?: AssetCriticality;
  healthScore?: number; // 0 - 100%
  residualValue?: number; // valor residual estimado (R$), usado no ranking CAPEX/OPEX
  photos?: string[];
  status: AssetStatus;
  date: string;
  osCount?: number;
  noTag?: boolean;
}
