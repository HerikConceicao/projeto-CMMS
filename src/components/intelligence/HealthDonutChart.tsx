import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { HealthDistributionBucket } from '../../utils/healthDistribution';

interface HealthDonutChartProps {
  data: HealthDistributionBucket[];
}

const COLORS: Record<HealthDistributionBucket['key'], string> = {
  Saudável: '#22c55e',
  Alerta: '#f59e0b',
  Crítico: '#ef4444',
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 shadow-xl">
      {entry.name}: <span className="font-medium">{entry.value}</span>
    </div>
  );
}

export function HealthDonutChart({ data }: HealthDonutChartProps) {
  const total = data.reduce((sum, bucket) => sum + bucket.count, 0);

  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">
        Nenhum ativo com Health Score cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="key"
              innerRadius="62%"
              outerRadius="100%"
              stroke="#09090b"
              strokeWidth={2}
            >
              {data.map((bucket) => (
                <Cell key={bucket.key} fill={COLORS[bucket.key]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-zinc-100">{total}</span>
          <span className="text-xs text-zinc-500">ativos</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {data.map((bucket) => (
          <div key={bucket.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[bucket.key] }}
            />
            <span className="text-sm text-zinc-300">{bucket.key}</span>
            <span className="text-sm text-zinc-500">
              {bucket.count} ({total > 0 ? Math.round((bucket.count / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
