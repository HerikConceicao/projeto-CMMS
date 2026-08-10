import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
}

export function KpiCard({ icon: Icon, label, value, caption }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="h-4 w-4 text-orange-500" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500">{caption}</p>
    </div>
  );
}
