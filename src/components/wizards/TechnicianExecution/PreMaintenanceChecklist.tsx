import { useState } from 'react';
import { Check, ShieldAlert } from 'lucide-react';
import { SAFETY_CHECKLIST_ITEMS } from '../../../data/safetyChecklist';

interface PreMaintenanceChecklistProps {
  onConfirm: () => void;
}

export function PreMaintenanceChecklist({ onConfirm }: PreMaintenanceChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (item: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const allChecked = checked.size === SAFETY_CHECKLIST_ITEMS.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-orange-500" />
        <p className="text-sm text-zinc-300">
          Confirme os itens de segurança antes de iniciar a intervenção no equipamento.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {SAFETY_CHECKLIST_ITEMS.map((item) => {
          const isChecked = checked.has(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                isChecked
                  ? 'border-green-500/40 bg-green-500/10'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  isChecked ? 'border-green-500 bg-green-500 text-zinc-950' : 'border-zinc-600'
                }`}
              >
                {isChecked && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="text-sm text-zinc-200">{item}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={!allChecked}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400 disabled:opacity-50"
      >
        Iniciar Execução
      </button>
    </div>
  );
}
