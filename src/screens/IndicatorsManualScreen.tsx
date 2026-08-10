import { ArrowLeft, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { INDICATORS_MANUAL } from '../data/indicatorsManual';

interface IndicatorsManualScreenProps {
  onExit: () => void;
}

export function IndicatorsManualScreen({ onExit }: IndicatorsManualScreenProps) {
  const { isDesktopMode } = useAppContext();

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-5 p-4 sm:p-6 ${isDesktopMode ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Voltar ao início"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold text-zinc-100">Manual de Indicadores Estratégicos</h1>
        </header>

        <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
          <BookOpen className="h-5 w-5 shrink-0 text-orange-500" />
          <p className="text-sm text-zinc-300">
            Referência dos parâmetros usados no Painel de Inteligência para acompanhar confiabilidade
            e custo da manutenção.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {INDICATORS_MANUAL.map((indicator) => (
            <div key={indicator.name} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">{indicator.name}</h2>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Fórmula</p>
              <p className="mt-0.5 font-mono text-sm text-orange-400">{indicator.formula}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Conceito</p>
              <p className="mt-0.5 text-sm text-zinc-400">{indicator.concept}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Significado para a Gestão
              </p>
              <p className="mt-0.5 text-sm text-zinc-400">{indicator.meaning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
