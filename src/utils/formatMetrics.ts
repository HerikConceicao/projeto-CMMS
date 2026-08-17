export function formatHours(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value)}h`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(0)}%`;
}
