import { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import type { Asset } from '../../../types';
import { generateAssetTag, isAssetTagTaken } from '../../../utils/assetTag';

export interface InventoryTagValue {
  assetNumber: string;
}

interface InventoryTagStepProps {
  initialValue: InventoryTagValue;
  wasNoTag: boolean;
  existingAssets: Asset[];
  onBack: () => void;
  onNext: (value: InventoryTagValue) => void;
}

export function InventoryTagStep({
  initialValue,
  wasNoTag,
  existingAssets,
  onBack,
  onNext,
}: InventoryTagStepProps) {
  const [assetNumber, setAssetNumber] = useState(
    initialValue.assetNumber || generateAssetTag(existingAssets),
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setAssetNumber(generateAssetTag(existingAssets));
    setError(null);
  };

  const handleNext = () => {
    const trimmed = assetNumber.trim();
    if (!trimmed) {
      setError('Informe uma TAG de inventário.');
      return;
    }
    if (isAssetTagTaken(trimmed, existingAssets)) {
      setError('Essa TAG já está em uso por outro ativo.');
      return;
    }
    onNext({ assetNumber: trimmed });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Inventário e Tag</h2>
        <p className="text-sm text-zinc-500">
          {wasNoTag
            ? 'Este ativo não possuía etiqueta. Uma nova TAG foi sugerida abaixo.'
            : 'Confirme ou ajuste o número de inventário deste ativo.'}
        </p>
      </div>

      <div>
        <label htmlFor="asset-tag" className="mb-2 block text-sm font-medium text-zinc-300">
          Número de patrimônio (TAG)
        </label>
        <div className="flex gap-2">
          <input
            id="asset-tag"
            type="text"
            value={assetNumber}
            onChange={(e) => {
              setAssetNumber(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Ex: PAT-0893"
            className="h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            Gerar nova
          </button>
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
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
          onClick={handleNext}
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
