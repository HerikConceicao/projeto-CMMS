import type { OrderOfService } from '../types';

const MS_PER_HOUR = 3_600_000;

export interface MaintenanceKpis {
  periodStart: Date;
  periodHours: number;
  stopsCount: number;
  downtimeHours: number;
  mtbfHours: number | null;
  availabilityPct: number | null;
  mttrHours: number | null;
  closedStopsCount: number;
  preventiveTotal: number;
  preventiveDone: number;
  preventiveAdherencePct: number | null;
}

/**
 * Deriva os indicadores a partir do histórico real de OSs (sem calendário de
 * PM dedicado): MTBF e Disponibilidade usam o período entre a OS mais antiga
 * e agora; MTTR usa apenas paradas já encerradas; Aderência Preventiva usa
 * Preventivas concluídas / Preventivas abertas como proxy do plano cumprido.
 */
export function computeMaintenanceKpis(
  orders: OrderOfService[],
  now: Date = new Date(),
): MaintenanceKpis {
  if (orders.length === 0) {
    return {
      periodStart: now,
      periodHours: 0,
      stopsCount: 0,
      downtimeHours: 0,
      mtbfHours: null,
      availabilityPct: null,
      mttrHours: null,
      closedStopsCount: 0,
      preventiveTotal: 0,
      preventiveDone: 0,
      preventiveAdherencePct: null,
    };
  }

  const periodStart = orders.reduce(
    (earliest, os) => (new Date(os.createdAt) < earliest ? new Date(os.createdAt) : earliest),
    new Date(orders[0].createdAt),
  );
  const periodHours = Math.max(1, (now.getTime() - periodStart.getTime()) / MS_PER_HOUR);

  const stops = orders.filter((os) => os.isMachineStopped);
  const downtimeHours = stops.reduce((sum, os) => {
    const start = new Date(os.createdAt).getTime();
    const end = os.closedAt ? new Date(os.closedAt).getTime() : now.getTime();
    return sum + Math.max(0, end - start) / MS_PER_HOUR;
  }, 0);

  const uptimeHours = Math.max(0, periodHours - downtimeHours);
  const mtbfHours = stops.length > 0 ? uptimeHours / stops.length : null;
  const availabilityPct = (uptimeHours / periodHours) * 100;

  const closedStops = stops.filter((os) => os.closedAt);
  const mttrHours =
    closedStops.length > 0
      ? closedStops.reduce((sum, os) => {
          const start = new Date(os.createdAt).getTime();
          const end = new Date(os.closedAt as string).getTime();
          return sum + Math.max(0, end - start) / MS_PER_HOUR;
        }, 0) / closedStops.length
      : null;

  const preventives = orders.filter((os) => os.type === 'Preventiva');
  const preventiveDone = preventives.filter((os) => os.status === 'Concluído').length;
  const preventiveAdherencePct =
    preventives.length > 0 ? (preventiveDone / preventives.length) * 100 : null;

  return {
    periodStart,
    periodHours,
    stopsCount: stops.length,
    downtimeHours,
    mtbfHours,
    availabilityPct,
    mttrHours,
    closedStopsCount: closedStops.length,
    preventiveTotal: preventives.length,
    preventiveDone,
    preventiveAdherencePct,
  };
}
