import { ShieldCheck } from 'lucide-react';
import type { TechnicianPerformanceRow } from '../../utils/auditMetrics';
import { formatHours, formatPercent } from '../../utils/formatMetrics';

interface TechnicianPerformanceTableProps {
  rows: TechnicianPerformanceRow[];
}

export function TechnicianPerformanceTable({ rows }: TechnicianPerformanceTableProps) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-zinc-500">Nenhum técnico cadastrado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Técnico</th>
            <th className="whitespace-nowrap py-2 pr-3 font-medium">OSs Resolvidas</th>
            <th className="whitespace-nowrap py-2 pr-3 font-medium">Taxa de Conclusão</th>
            <th className="whitespace-nowrap py-2 pr-3 font-medium">Sem Reincidência</th>
            <th className="whitespace-nowrap py-2 pr-3 font-medium">Reparo Médio</th>
            <th className="whitespace-nowrap py-2 font-medium">Qualidade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.user.id} className="border-b border-zinc-800/60 last:border-0">
              <td className="py-2.5 pr-3">
                <p className="font-medium text-zinc-100">{row.user.name}</p>
                <p className="text-xs text-zinc-500">{row.assignedCount} OS atribuída{row.assignedCount === 1 ? '' : 's'}</p>
              </td>
              <td className="py-2.5 pr-3 tabular-nums text-zinc-300">{row.resolvedCount}</td>
              <td className="py-2.5 pr-3 tabular-nums text-zinc-300">
                {formatPercent(row.completionRatePct)}
              </td>
              <td className="py-2.5 pr-3">
                {row.resolvedCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-green-500/30 bg-green-500/15 px-2.5 py-1 text-xs text-green-400">
                    <ShieldCheck className="h-3 w-3" />
                    {row.noRecurrenceCount}/{row.resolvedCount}
                  </span>
                ) : (
                  <span className="text-zinc-500">—</span>
                )}
              </td>
              <td className="py-2.5 pr-3 tabular-nums text-zinc-300">
                {formatHours(row.avgRepairHours)}
              </td>
              <td className="py-2.5 tabular-nums text-zinc-300">
                {formatPercent(row.qualityScorePct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
