import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { healthScoreBarClasses, healthScoreLabel, healthScoreTextClasses } from '../../../utils/badges';

export interface HealthScoreValue {
  healthScore: number;
}

interface HealthScoreStepProps {
  initialValue: HealthScoreValue;
  onBack: () => void;
  onNext: (value: HealthScoreValue) => void;
}

export function HealthScoreStep({ initialValue, onBack, onNext }: HealthScoreStepProps) {
  const [healthScore, setHealthScore] = useState(initialValue.healthScore);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Saúde do Ativo</h2>
        <p className="text-sm text-zinc-500">
          Avalie o estado atual de conservação e funcionamento do ativo.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className={`text-2xl font-semibold ${healthScoreTextClasses(healthScore)}`}>
            {healthScore}%
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${healthScoreTextClasses(healthScore)} border-current/30`}>
            {healthScoreLabel(healthScore)}
          </span>
        </div>

        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${healthScoreBarClasses(healthScore)}`}
            style={{ width: `${healthScore}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={healthScore}
          onChange={(e) => setHealthScore(Number(e.target.value))}
          aria-label="Health Score"
          className="w-full accent-orange-500"
        />
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={() => onNext({ healthScore })}
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
