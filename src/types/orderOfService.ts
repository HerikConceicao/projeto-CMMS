export type OSPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type OSStatus =
  | 'Aberto'
  | 'Em Andamento'
  | 'Pendente Validação'
  | 'Concluído'
  | 'Cancelado';

export type OSType = 'Preventiva' | 'Corretiva' | 'Preditiva';

export interface OrderOfService {
  id: number; // Ex: 1023
  assetId: number;
  assetName: string;
  assetNumber: string;
  sector: string;
  priority: OSPriority;
  status: OSStatus;
  createdAt: string;
  createdBy: string;
  assignedTo?: number; // User ID do técnico
  type: OSType;
  estimatedTime?: string;
  description: string;
  attendedAt?: string; // quando o técnico iniciou o atendimento presencial
  reportPhotos?: string[]; // fotos da falha, anexadas na abertura da OS
  isMachineStopped: boolean;
  horimeterStart?: number;
  horimeterEnd?: number;
  executionReport?: string;
  executionPhotos?: string[];
  closedAt?: string;
  releasedBy?: string;
  laborCost?: number;
  partsCost?: number;
  releaseRejectionReason?: string; // motivo da última rejeição na liberação de máquina
}
