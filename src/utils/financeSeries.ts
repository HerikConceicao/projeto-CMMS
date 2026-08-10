import type { OrderOfService } from '../types';

export interface MonthlySpend {
  monthKey: string;
  label: string;
  gastoReal: number;
  orcamento: number;
}

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Últimos `monthsBack` meses (incluindo o atual), com gasto real somado por OS encerrada/registrada em cada mês. */
export function buildMonthlySpend(
  orders: OrderOfService[],
  budgetMensal: number,
  monthsBack = 6,
  now: Date = new Date(),
): MonthlySpend[] {
  const months: MonthlySpend[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d
      .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace('.', '');
    months.push({ monthKey: monthKeyOf(d), label, gastoReal: 0, orcamento: budgetMensal });
  }

  const byMonth = new Map(months.map((m) => [m.monthKey, m]));

  orders.forEach((os) => {
    if (os.laborCost === undefined && os.partsCost === undefined) return;
    const refDate = new Date(os.closedAt ?? os.createdAt);
    const bucket = byMonth.get(monthKeyOf(refDate));
    if (!bucket) return;
    bucket.gastoReal += (os.laborCost ?? 0) + (os.partsCost ?? 0);
  });

  return months;
}
