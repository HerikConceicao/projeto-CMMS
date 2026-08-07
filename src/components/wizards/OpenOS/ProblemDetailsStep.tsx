import { useState } from 'react';
import { ArrowLeft, Octagon, TriangleAlert } from 'lucide-react';
import type { OSPriority, OSType, TipoProblema } from '../../../types';
import { PRIORITY_LABELS, priorityClasses } from '../../../utils/badges';
import { PhotoCapture } from '../../ui/PhotoCapture';

export interface ProblemDetailsValue {
  type: Extract<OSType, 'Corretiva' | 'Preventiva'>;
  priority: OSPriority;
  symptoms: string[];
  isMachineStopped: boolean;
  description: string;
  photos: string[];
}

interface ProblemDetailsStepProps {
  problemas: TipoProblema[];
  onBack: () => void;
  onSubmit: (value: ProblemDetailsValue) => void;
}

const MAINTENANCE_TYPES: Array<Extract<OSType, 'Corretiva' | 'Preventiva'>> = [
  'Corretiva',
  'Preventiva',
];

const PRIORITIES: OSPriority[] = ['baixa', 'media', 'alta', 'urgente'];

export function ProblemDetailsStep({ problemas, onBack, onSubmit }: ProblemDetailsStepProps) {
  const [type, setType] = useState<Extract<OSType, 'Corretiva' | 'Preventiva'>>('Corretiva');
  const [priority, setPriority] = useState<OSPriority>('media');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [isMachineStopped, setIsMachineStopped] = useState<boolean | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleSymptom = (name: string) => {
    setSymptoms((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      setFormError('Descreva o problema antes de continuar.');
      return;
    }
    if (isMachineStopped === null) {
      setFormError('Informe se a máquina está parada ou produzindo com restrição.');
      return;
    }
    setFormError(null);
    onSubmit({ type, priority, symptoms, isMachineStopped, description: description.trim(), photos });
  };

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Tipo de manutenção</p>
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          {MAINTENANCE_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
                type === option ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Prioridade</p>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPriority(option)}
              className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                priority === option
                  ? priorityClasses(option)
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              {PRIORITY_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {problemas.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Sintomas observados</p>
          <div className="flex flex-wrap gap-2">
            {problemas.map((problema) => {
              const selected = symptoms.includes(problema.name);
              return (
                <button
                  key={problema.id}
                  type="button"
                  onClick={() => toggleSymptom(problema.name)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    selected
                      ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {problema.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Situação da máquina</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsMachineStopped(true)}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors ${
              isMachineStopped === true
                ? 'border-red-500/50 bg-red-500/15 text-red-400'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Octagon className="h-4 w-4" />
            Máquina Parada
          </button>
          <button
            type="button"
            onClick={() => setIsMachineStopped(false)}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors ${
              isMachineStopped === false
                ? 'border-orange-500/50 bg-orange-500/15 text-orange-400'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <TriangleAlert className="h-4 w-4" />
            Produzindo com Restrição
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-300">
          Descrição do problema
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (formError) setFormError(null);
          }}
          rows={4}
          placeholder="Descreva o que está acontecendo com o equipamento..."
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Fotos da falha</p>
        <PhotoCapture photos={photos} onChange={setPhotos} />
      </div>

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400"
      >
        Abrir Ordem de Serviço
      </button>
    </div>
  );
}
