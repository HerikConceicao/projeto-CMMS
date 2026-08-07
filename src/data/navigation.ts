import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Boxes,
  Camera,
  ClipboardList,
  ClipboardPlus,
  Database,
  FileSearch,
  ListChecks,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import type { ScreenId } from '../types';

export interface QuickAction {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'open-os', label: 'Abrir ordem de serviço', icon: ClipboardPlus },
  { id: 'manage-os', label: 'Gestão de Ordem de Serviço', icon: ClipboardList },
  { id: 'os-list', label: 'Lista de ordens de serviço', icon: ListChecks },
  { id: 'manage-users', label: 'Gerenciar usuários', icon: Users },
  { id: 'pre-registration', label: 'Pré-cadastro do sistema', icon: Database },
  { id: 'asset-management', label: 'Gestão de ativos', icon: Boxes },
  { id: 'report-asset', label: 'Reportar máquina', icon: Camera },
  { id: 'machine-release', label: 'Liberação de Máquina', icon: ShieldCheck },
  { id: 'technician-panel', label: 'Painel do Técnico', icon: Wrench },
  { id: 'intelligence-panel', label: 'Painel de Inteligência', icon: BarChart3 },
  { id: 'audit', label: 'Auditoria', icon: FileSearch },
];
