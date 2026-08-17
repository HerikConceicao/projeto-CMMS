import type { OrderOfService, User } from '../types';

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function hoursBetween(startIso: string, endIso: string): number {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / MS_PER_HOUR);
}

export interface ResponseMetrics {
  attendanceHours: number | null; // abertura -> chegada do técnico
  attendanceCount: number;
  repairHours: number | null; // chegada -> encerramento
  repairCount: number;
}

/** Métricas de resposta: só considera OSs que passaram pelo atendimento presencial (attendedAt). */
export function computeResponseMetrics(orders: OrderOfService[]): ResponseMetrics {
  const attended = orders.filter((os) => os.attendedAt);
  const attendanceHours =
    attended.length > 0
      ? attended.reduce((sum, os) => sum + hoursBetween(os.createdAt, os.attendedAt as string), 0) /
        attended.length
      : null;

  const repaired = attended.filter((os) => os.closedAt);
  const repairHours =
    repaired.length > 0
      ? repaired.reduce(
          (sum, os) => sum + hoursBetween(os.attendedAt as string, os.closedAt as string),
          0,
        ) / repaired.length
      : null;

  return {
    attendanceHours,
    attendanceCount: attended.length,
    repairHours,
    repairCount: repaired.length,
  };
}

/**
 * Rubrica de rigor do preenchimento: laudo com conteúdo mínimo, horímetro
 * inicial/final coerentes e fotos de execução anexadas. Só avalia OSs que
 * já passaram por execução (têm laudo ou horímetro registrado).
 */
export function osFillQualityScore(os: OrderOfService): number | null {
  if (os.horimeterStart === undefined && !os.executionReport) return null;

  let points = 0;
  const total = 3;
  if (os.executionReport && os.executionReport.trim().length >= 40) points += 1;
  if (
    os.horimeterStart !== undefined &&
    os.horimeterEnd !== undefined &&
    os.horimeterEnd >= os.horimeterStart
  ) {
    points += 1;
  }
  if (os.executionPhotos && os.executionPhotos.length > 0) points += 1;

  return (points / total) * 100;
}

export interface FillQualityStats {
  scoredCount: number;
  overallScorePct: number | null;
  reportCompletePct: number | null;
  horimeterCompletePct: number | null;
  photosPct: number | null;
}

export function computeFillQuality(orders: OrderOfService[]): FillQualityStats {
  const scored = orders.filter((os) => osFillQualityScore(os) !== null);
  if (scored.length === 0) {
    return {
      scoredCount: 0,
      overallScorePct: null,
      reportCompletePct: null,
      horimeterCompletePct: null,
      photosPct: null,
    };
  }

  const overallScorePct =
    scored.reduce((sum, os) => sum + (osFillQualityScore(os) ?? 0), 0) / scored.length;
  const reportCompletePct =
    (scored.filter((os) => os.executionReport && os.executionReport.trim().length >= 40).length /
      scored.length) *
    100;
  const horimeterCompletePct =
    (scored.filter(
      (os) =>
        os.horimeterStart !== undefined &&
        os.horimeterEnd !== undefined &&
        os.horimeterEnd >= os.horimeterStart,
    ).length /
      scored.length) *
    100;
  const photosPct =
    (scored.filter((os) => os.executionPhotos && os.executionPhotos.length > 0).length /
      scored.length) *
    100;

  return { scoredCount: scored.length, overallScorePct, reportCompletePct, horimeterCompletePct, photosPct };
}

function isRecurrence(
  target: OrderOfService,
  allOrders: OrderOfService[],
  windowDays: number,
): boolean {
  if (!target.closedAt) return false;
  const closedTime = new Date(target.closedAt).getTime();
  const windowMs = windowDays * MS_PER_DAY;
  return allOrders.some((os) => {
    if (os.id === target.id || os.assetId !== target.assetId) return false;
    const createdTime = new Date(os.createdAt).getTime();
    return createdTime > closedTime && createdTime <= closedTime + windowMs;
  });
}

export interface TechnicianPerformanceRow {
  user: User;
  assignedCount: number;
  resolvedCount: number;
  completionRatePct: number | null;
  noRecurrenceCount: number;
  avgRepairHours: number | null;
  qualityScorePct: number | null;
}

/** Ranking por técnico: rendimento (OSs resolvidas), reincidência (nova OS no mesmo ativo em até `windowDays`) e qualidade de preenchimento. */
export function computeTechnicianPerformance(
  users: User[],
  orders: OrderOfService[],
  windowDays = 30,
): TechnicianPerformanceRow[] {
  return users
    .filter((user) => user.role === 'Técnico')
    .map((user) => {
      const assigned = orders.filter((os) => os.assignedTo === user.id);
      const resolved = assigned.filter((os) => os.status === 'Concluído');

      const recurrentCount = resolved.filter((os) => isRecurrence(os, orders, windowDays)).length;
      const noRecurrenceCount = resolved.length - recurrentCount;

      const repairSamples = resolved.filter((os) => os.attendedAt && os.closedAt);
      const avgRepairHours =
        repairSamples.length > 0
          ? repairSamples.reduce(
              (sum, os) => sum + hoursBetween(os.attendedAt as string, os.closedAt as string),
              0,
            ) / repairSamples.length
          : null;

      const qualityScores = assigned
        .map((os) => osFillQualityScore(os))
        .filter((score): score is number => score !== null);
      const qualityScorePct =
        qualityScores.length > 0
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
          : null;

      return {
        user,
        assignedCount: assigned.length,
        resolvedCount: resolved.length,
        completionRatePct: assigned.length > 0 ? (resolved.length / assigned.length) * 100 : null,
        noRecurrenceCount,
        avgRepairHours,
        qualityScorePct,
      };
    })
    .sort((a, b) => b.resolvedCount - a.resolvedCount);
}
