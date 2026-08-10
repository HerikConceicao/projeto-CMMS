import { Octagon, TriangleAlert } from 'lucide-react';
import type { OrderOfService } from '../../types';
import { Modal } from '../ui/Modal';
import { InfoRow } from '../ui/InfoRow';
import { PRIORITY_LABELS, priorityClasses, statusClasses } from '../../utils/badges';
import { formatDateTime } from '../../utils/date';
import { formatBRL } from '../../utils/currency';

interface OSDetailModalProps {
  os: OrderOfService;
  assignedToName?: string;
  onClose: () => void;
}

function PhotoGallery({ title, photos }: { title: string; photos: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-300">{title}</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <a
            key={index}
            href={photo}
            target="_blank"
            rel="noreferrer"
            className="block h-20 w-20 overflow-hidden rounded-lg border border-zinc-800"
          >
            <img src={photo} alt={`${title} ${index + 1}`} className="h-full w-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function OSDetailModal({ os, assignedToName, onClose }: OSDetailModalProps) {
  const hasExecutionData =
    os.horimeterStart !== undefined ||
    os.executionReport ||
    (os.executionPhotos && os.executionPhotos.length > 0) ||
    os.closedAt;

  return (
    <Modal title={`OS #${os.id}`} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs ${statusClasses(os.status)}`}>
            {os.status}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${priorityClasses(os.priority)}`}>
            Prioridade {PRIORITY_LABELS[os.priority]}
          </span>
          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400">
            {os.type}
          </span>
          <span
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
              os.isMachineStopped
                ? 'border-red-500/30 bg-red-500/15 text-red-400'
                : 'border-orange-500/30 bg-orange-500/15 text-orange-400'
            }`}
          >
            {os.isMachineStopped ? (
              <Octagon className="h-3 w-3" />
            ) : (
              <TriangleAlert className="h-3 w-3" />
            )}
            {os.isMachineStopped ? 'Parada' : 'Restrição'}
          </span>
        </div>

        <div>
          <h3 className="text-base font-semibold text-zinc-100">{os.assetName}</h3>
          <p className="text-sm text-zinc-500">
            {os.assetNumber} · {os.sector}
          </p>
        </div>

        <div>
          <InfoRow label="Criado por" value={os.createdBy} />
          <InfoRow label="Criado em" value={formatDateTime(os.createdAt)} />
          {assignedToName && <InfoRow label="Técnico responsável" value={assignedToName} />}
          {os.estimatedTime && <InfoRow label="Tempo estimado" value={os.estimatedTime} />}
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-300">Descrição</p>
          <p className="whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-sm text-zinc-400">
            {os.description}
          </p>
        </div>

        {os.reportPhotos && os.reportPhotos.length > 0 && (
          <PhotoGallery title="Fotos da falha" photos={os.reportPhotos} />
        )}

        {hasExecutionData && (
          <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
            <p className="text-sm font-medium text-zinc-300">Execução</p>
            <div>
              {os.horimeterStart !== undefined && (
                <InfoRow label="Horímetro inicial" value={String(os.horimeterStart)} />
              )}
              {os.horimeterEnd !== undefined && (
                <InfoRow label="Horímetro final" value={String(os.horimeterEnd)} />
              )}
              {os.closedAt && <InfoRow label="Concluído em" value={formatDateTime(os.closedAt)} />}
              {os.releasedBy && <InfoRow label="Liberado por" value={os.releasedBy} />}
              {os.laborCost !== undefined && (
                <InfoRow label="Custo de mão de obra" value={formatBRL(os.laborCost)} />
              )}
              {os.partsCost !== undefined && (
                <InfoRow label="Custo de peças" value={formatBRL(os.partsCost)} />
              )}
            </div>
            {os.executionReport && (
              <div>
                <p className="mb-1 text-sm font-medium text-zinc-300">Laudo técnico</p>
                <p className="whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-sm text-zinc-400">
                  {os.executionReport}
                </p>
              </div>
            )}
            {os.executionPhotos && os.executionPhotos.length > 0 && (
              <PhotoGallery title="Fotos da execução" photos={os.executionPhotos} />
            )}
          </div>
        )}

        {os.releaseRejectionReason && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="mb-1 text-sm font-medium text-red-400">Liberação rejeitada</p>
            <p className="text-sm text-zinc-300">{os.releaseRejectionReason}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
