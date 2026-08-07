export type UserRole = 'Gestor' | 'Técnico' | 'Liberador' | 'Operador';

export type UserStatus = 'Ativo' | 'Inativo';

export interface UserPermissions {
  openOS: boolean;
  execOS: boolean;
  liberate: boolean;
  assets: boolean;
  manageUsers: boolean;
  reports: boolean;
  viewIntelligence?: boolean;
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone: string;
  email?: string;
  osCreated?: number;
  osOpen?: number;
  permissions: UserPermissions;
}
