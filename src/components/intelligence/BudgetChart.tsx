import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlySpend } from '../../utils/financeSeries';
import { formatBRL } from '../../utils/currency';

interface BudgetChartProps {
  data: MonthlySpend[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm shadow-xl">
      <p className="mb-1.5 font-medium text-zinc-200">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2 text-zinc-400">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-medium text-zinc-200">{formatBRL(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function BudgetChart({ data }: BudgetChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#71717a"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
            formatter={(value: string) => <span className="text-zinc-400">{value}</span>}
          />
          <Bar dataKey="gastoReal" name="Gasto Real" fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
          <Line
            dataKey="orcamento"
            name="Orçamento Mensal"
            stroke="#a1a1aa"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: '#a1a1aa', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
