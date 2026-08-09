import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { AssetCriticality } from '../../../types';
import { criticalityClasses } from '../../../utils/badges';

export interface LocationCriticalityValue {
  locationDetails: string;
  criticality: AssetCriticality;
}

interface LocationCriticalityStepProps {
  initialValue: LocationCriticalityValue;
  onBack: () => void;
  onNext: (value: LocationCriticalityValue) => void;
}

const CRITICALITY_OPTIONS: { value: AssetCriticality; description: string }[] = [
  { value: 'Baixa', description: 'Sem impacto relevante na produção se parar.' },
  { value: 'Média', description: 'Impacto moderado, produção continua com restrições.' },
  { value: 'Alta', description: 'Impacto significativo, gera perdas relevantes.' },
  { value: 'Crítica', description: 'Parada interrompe a produção por completo.' },
];

export function LocationCriticalityStep({
  initialValue,
  onBack,
  onNext,
}: LocationCriticalityStepProps) {
  const [locationDetails, setLocationDetails] = useState(initialValue.locationDetails);
  const [criticality, setCriticality] = useState<AssetCriticality>(initialValue.criticality);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Localização e Criticidade</h2>
        <p className="text-sm text-zinc-500">Detalhe onde encontrar o ativo e seu grau de criticidade.</p>
      </div>

      <div>
        <label htmlFor="asset-location" className="mb-2 block text-sm font-medium text-zinc-300">
          Localização detalhada
        </label>
        <input
          id="asset-location"
          type="text"
          value={locationDetails}
          onChange={(e) => setLocationDetails(e.target.value)}
          placeholder="Ex: Galpão 2, próximo à linha 3"
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-300">Grau de criticidade</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CRITICALITY_OPTIONS.map((option) => {
            const selected = criticality === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setCriticality(option.value)}
                className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                  selected ? criticalityClasses(option.value) : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {option.value}
                </span>
                <span className="text-xs opacity-80">{option.description}</span>
              </button>
            );
          })}
        </div>
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
          onClick={() => onNext({ locationDetails: locationDetails.trim(), criticality })}
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
