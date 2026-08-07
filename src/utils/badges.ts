import type { AssetCriticality, OSPriority, OSStatus } from '../types';

export function criticalityClasses(criticality?: AssetCriticality): string {
  switch (criticality) {
    case 'Crítica':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'Alta':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Média':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'Baixa':
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}

export function priorityClasses(priority: OSPriority): string {
  switch (priority) {
    case 'urgente':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'alta':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'media':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'baixa':
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}

export const PRIORITY_LABELS: Record<OSPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export function statusClasses(status: OSStatus): string {
  switch (status) {
    case 'Aberto':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'Em Andamento':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'Pendente Validação':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'Concluído':
      return 'bg-green-500/15 text-green-400 border-green-500/30';
    case 'Cancelado':
      return 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30';
  }
}
