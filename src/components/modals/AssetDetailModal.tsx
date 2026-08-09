import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Asset } from '../../types';
import { Modal } from '../ui/Modal';
import { InfoRow } from '../ui/InfoRow';
import {
  ASSET_STATUS_LABELS,
  assetStatusClasses,
  criticalityClasses,
  healthScoreBarClasses,
  healthScoreTextClasses,
} from '../../utils/badges';
import { formatDate } from '../../utils/date';

interface AssetDetailModalProps {
  asset: Asset;
  onClose: () => void;
}

export function AssetDetailModal({ asset, onClose }: AssetDetailModalProps) {
  const healthScore = asset.healthScore ?? 0;

  return (
    <Modal title={asset.name} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs ${assetStatusClasses(asset.status)}`}>
            {ASSET_STATUS_LABELS[asset.status]}
          </span>
          {asset.criticality && (
            <span className={`rounded-full border px-2.5 py-1 text-xs ${criticalityClasses(asset.criticality)}`}>
              Criticidade {asset.criticality}
            </span>
          )}
        </div>

        <div className="flex justify-center">
          <div className="print-area flex w-40 flex-col items-center gap-1.5 rounded-lg border border-zinc-700 bg-white p-3 text-center">
            <QRCodeSVG value={asset.assetNumber} size={104} level="M" />
            <p className="text-xs font-bold text-zinc-950">{asset.assetNumber}</p>
            <p className="line-clamp-2 text-[10px] text-zinc-700">{asset.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          <Printer className="h-4 w-4" />
          Imprimir etiqueta
        </button>

        {healthScore > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Health Score</span>
              <span className={`text-sm font-medium ${healthScoreTextClasses(healthScore)}`}>
                {healthScore}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${healthScoreBarClasses(healthScore)}`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <InfoRow label="TAG / Patrimônio" value={asset.assetNumber} />
          <InfoRow label="Setor" value={asset.sector} />
          {asset.type && <InfoRow label="Tipo" value={asset.type} />}
          {asset.manufacturer && <InfoRow label="Fabricante" value={asset.manufacturer} />}
          {asset.model && <InfoRow label="Modelo" value={asset.model} />}
          {asset.serialNumber && <InfoRow label="Número de série" value={asset.serialNumber} />}
          {asset.locationDetails && <InfoRow label="Localização" value={asset.locationDetails} />}
          <InfoRow label="Ordens de serviço" value={String(asset.osCount ?? 0)} />
          <InfoRow label="Validado em" value={formatDate(asset.date)} />
        </div>
      </div>
    </Modal>
  );
}
