import type { UserPermissions, UserRole } from '../types';

export const ROLE_PERMISSION_DEFAULTS: Record<UserRole, UserPermissions> = {
  Gestor: {
    openOS: true,
    execOS: true,
    liberate: true,
    assets: true,
    manageUsers: true,
    reports: true,
    viewIntelligence: true,
  },
  Liberador: {
    openOS: true,
    execOS: false,
    liberate: true,
    assets: false,
    manageUsers: false,
    reports: true,
    viewIntelligence: false,
  },
  Técnico: {
    openOS: true,
    execOS: true,
    liberate: false,
    assets: false,
    manageUsers: false,
    reports: false,
    viewIntelligence: false,
  },
  Operador: {
    openOS: true,
    execOS: false,
    liberate: false,
    assets: false,
    manageUsers: false,
    reports: false,
    viewIntelligence: false,
  },
};

export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  openOS: 'Abrir ordem de serviço',
  execOS: 'Executar ordem de serviço',
  liberate: 'Liberar máquina',
  assets: 'Gerenciar ativos',
  manageUsers: 'Gerenciar usuários',
  reports: 'Relatórios',
  viewIntelligence: 'Painel de Inteligência',
};
