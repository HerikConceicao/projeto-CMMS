import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { AssetReplacementRow } from '../../utils/assetReplacement';
import { replacementRecommendation } from '../../utils/assetReplacement';
import { formatBRL } from '../../utils/currency';

interface ReplacementRankingTableProps {
  rows: AssetReplacementRow[];
}

const RECOMMENDATION_CONFIG = {
  substituir: {
    label: 'Substituição recomendada',
    classes: 'border-red-500/30 bg-red-500/15 text-red-400',
    icon: AlertTriangle,
  },
  avaliar: {
    label: 'Avaliar substituição',
    classes: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
    icon: TrendingUp,
  },
  controlado: {
    label: 'Custo sob controle',
    classes: 'border-green-500/30 bg-green-500/15 text-green-400',
    icon: CheckCircle2,
  },
} as const;

export function ReplacementRankingTable({ rows }: ReplacementRankingTableProps) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-zinc-500">Nenhum ativo validado ainda.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Ativo</th>
            <th className="whitespace-nowrap py-2 pr-3 font-medium">Custo Acumulado</th>
            <th className="whitespace-nowrap py-2 pr-3 font-medium">Valor Residual</th>
            <th className="whitespace-nowrap py-2 pr-3 font-medium">Relação</th>
            <th className="whitespace-nowrap py-2 font-medium">Recomendação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ asset, accumulatedCost, ratioPct }) => {
            const recommendation = replacementRecommendation(ratioPct);
            const config = RECOMMENDATION_CONFIG[recommendation];
            return (
              <tr key={asset.id} className="border-b border-zinc-800/60 last:border-0">
                <td className="py-2.5 pr-3">
                  <p className="font-medium text-zinc-100">{asset.name}</p>
                  <p className="text-xs text-zinc-500">{asset.assetNumber}</p>
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-300">
                  {formatBRL(accumulatedCost)}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-300">
                  {asset.residualValue ? formatBRL(asset.residualValue) : '—'}
                </td>
                <td className="py-2.5 pr-3 tabular-nums text-zinc-300">
                  {ratioPct !== null ? `${ratioPct.toFixed(1)}%` : '—'}
                </td>
                <td className="py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs ${config.classes}`}
                  >
                    <config.icon className="h-3 w-3" />
                    {config.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
