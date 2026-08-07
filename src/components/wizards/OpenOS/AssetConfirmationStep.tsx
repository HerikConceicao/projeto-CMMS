import { ArrowLeft, Factory, MapPin, Tag } from 'lucide-react';
import type { Asset } from '../../../types';
import { criticalityClasses } from '../../../utils/badges';
import { formatDate } from '../../../utils/date';
import { InfoRow } from '../../ui/InfoRow';

interface AssetConfirmationStepProps {
  asset: Asset;
  onConfirm: () => void;
  onChangeAsset: () => void;
}

function healthColor(score?: number): string {
  if (score === undefined) return 'bg-zinc-600';
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

export function AssetConfirmationStep({
  asset,
  onConfirm,
  onChangeAsset,
}: AssetConfirmationStepProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onChangeAsset}
        className="mb-4 flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Selecionar outro ativo
      </button>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{asset.name}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <Tag className="h-3.5 w-3.5" />
              {asset.assetNumber}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${criticalityClasses(asset.criticality)}`}
          >
            Criticidade {asset.criticality ?? 'N/D'}
          </span>
        </div>

        {asset.healthScore !== undefined && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>Health Score</span>
              <span>{asset.healthScore}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${healthColor(asset.healthScore)}`}
                style={{ width: `${asset.healthScore}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <InfoRow
            label="Setor"
            value={asset.sector}
          />
          {asset.type && <InfoRow label="Tipo de Equipamento" value={asset.type} />}
          {asset.manufacturer && (
            <InfoRow
              label="Fabricante / Modelo"
              value={`${asset.manufacturer}${asset.model ? ` · ${asset.model}` : ''}`}
            />
          )}
          {asset.serialNumber && <InfoRow label="Número de Série" value={asset.serialNumber} />}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-950 p-3 text-xs text-zinc-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {asset.locationDetails ?? `${asset.sector} · localização padrão do setor`}
        </div>
        {asset.manufacturer && (
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
            <Factory className="h-3.5 w-3.5 shrink-0" />
            Cadastrado em {formatDate(asset.date)}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400"
      >
        Confirmar equipamento
      </button>
    </div>
  );
}
