export interface RoleCost {
  id: string;
  name: string;
  hourlyRate: number;
}

export interface FinancialSettings {
  budgetMensal: number;
  roles: RoleCost[];
}
