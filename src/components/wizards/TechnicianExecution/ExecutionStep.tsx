import { useEffect, useState } from 'react';
import { Gauge, Pause, Play } from 'lucide-react';
import { PhotoCapture } from '../../ui/PhotoCapture';

export interface ExecutionStepValue {
  horimeterStart: number;
  horimeterEnd: number;
  executionReport: string;
  executionPhotos: string[];
}

interface ExecutionStepProps {
  onSubmit: (value: ExecutionStepValue) => void;
}

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export function ExecutionStep({ onSubmit }: ExecutionStepProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [horimeterStart, setHorimeterStart] = useState('');
  const [horimeterEnd, setHorimeterEnd] = useState('');
  const [executionReport, setExecutionReport] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const timerLabel = !isRunning && elapsedSeconds === 0 ? 'Iniciar' : isRunning ? 'Pausar' : 'Retomar';

  const handleSubmit = () => {
    const start = Number(horimeterStart);
    const end = Number(horimeterEnd);

    if (horimeterStart.trim() === '' || Number.isNaN(start) || start < 0) {
      setFormError('Informe um horímetro inicial válido.');
      return;
    }
    if (horimeterEnd.trim() === '' || Number.isNaN(end) || end < 0) {
      setFormError('Informe um horímetro final válido.');
      return;
    }
    if (end < start) {
      setFormError('O horímetro final não pode ser menor que o inicial.');
      return;
    }
    if (!executionReport.trim()) {
      setFormError('Descreva o laudo técnico antes de continuar.');
      return;
    }

    setFormError(null);
    onSubmit({ horimeterStart: start, horimeterEnd: end, executionReport: executionReport.trim(), executionPhotos: photos });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="font-mono text-4xl font-semibold tabular-nums text-zinc-100">
          {formatElapsed(elapsedSeconds)}
        </p>
        <button
          type="button"
          onClick={() => setIsRunning((r) => !r)}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {timerLabel}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="horimeterStart" className="mb-2 block text-sm font-medium text-zinc-300">
            Horímetro Inicial
          </label>
          <div className="relative">
            <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="horimeterStart"
              type="number"
              inputMode="decimal"
              min={0}
              value={horimeterStart}
              onChange={(e) => {
                setHorimeterStart(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="0"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="horimeterEnd" className="mb-2 block text-sm font-medium text-zinc-300">
            Horímetro Final
          </label>
          <div className="relative">
            <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="horimeterEnd"
              type="number"
              inputMode="decimal"
              min={0}
              value={horimeterEnd}
              onChange={(e) => {
                setHorimeterEnd(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="0"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="executionReport" className="mb-2 block text-sm font-medium text-zinc-300">
          Laudo técnico
        </label>
        <textarea
          id="executionReport"
          value={executionReport}
          onChange={(e) => {
            setExecutionReport(e.target.value);
            if (formError) setFormError(null);
          }}
          rows={4}
          placeholder="Descreva o serviço realizado, peças trocadas e observações finais..."
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Fotos da conclusão</p>
        <PhotoCapture photos={photos} onChange={setPhotos} />
      </div>

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400"
      >
        Finalizar Execução
      </button>
    </div>
  );
}
