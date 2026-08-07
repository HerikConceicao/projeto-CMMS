import type { FinancialSettings } from '../../types';

export const seedFinancialSettings: FinancialSettings = {
  budgetMensal: 45000,
  roles: [
    { id: 'tecnico-junior', name: 'Técnico Júnior', hourlyRate: 35 },
    { id: 'tecnico-pleno', name: 'Técnico Pleno', hourlyRate: 48 },
    { id: 'tecnico-senior', name: 'Técnico Sênior', hourlyRate: 62 },
    { id: 'eletricista', name: 'Eletricista', hourlyRate: 55 },
    { id: 'lider-manutencao', name: 'Líder de Manutenção', hourlyRate: 78 },
  ],
};
