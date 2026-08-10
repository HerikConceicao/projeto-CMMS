import { useState } from 'react';
import { ArrowLeft, Clock3, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { MachineReleaseModal } from '../components/modals/MachineReleaseModal';
import { formatDateTime } from '../utils/date';

interface MachineReleaseScreenProps {
  onExit: () => void;
}

export function MachineReleaseScreen({ onExit }: MachineReleaseScreenProps) {
  const { ordersOfService, setOrdersOfService, currentUser, isDesktopMode } = useAppContext();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const queue = ordersOfService
    .filter((os) => os.status === 'Pendente Validação')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const selectedOS = queue.find((os) => os.id === selectedId) ?? null;
  const releasedBy = currentUser?.name ?? 'Liberador';

  const handleApprove = () => {
    if (!selectedOS) return;
    setOrdersOfService((prev) =>
      prev.map((os) =>
        os.id === selectedOS.id
          ? {
              ...os,
              status: 'Concluído',
              closedAt: new Date().toISOString(),
              releasedBy,
              releaseRejectionReason: undefined,
            }
          : os,
      ),
    );
    setSelectedId(null);
  };

  const handleReject = (reason: string) => {
    if (!selectedOS) return;
    setOrdersOfService((prev) =>
      prev.map((os) =>
        os.id === selectedOS.id
          ? { ...os, status: 'Em Andamento', releaseRejectionReason: reason }
          : os,
      ),
    );
    setSelectedId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-5 p-4 sm:p-6 ${isDesktopMode ? 'max-w-4xl' : 'max-w-xl'}`}
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
          <h1 className="text-base font-semibold text-zinc-100">Liberação de Máquina</h1>
        </header>

        <p className="text-sm text-zinc-500">
          Inspecione a máquina após a manutenção e confirme a liberação para retorno à produção.
        </p>

        {queue.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            Nenhuma ordem de serviço aguardando liberação no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {queue.map((os) => (
              <div
                key={os.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      #{os.id} · {os.assetName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {os.assetNumber} · {os.sector}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                    <Clock3 className="h-3 w-3" />
                    Aguardando
                  </span>
                </div>

                <p className="text-xs text-zinc-500">Aberta em {formatDateTime(os.createdAt)}</p>

                {os.executionReport && (
                  <p className="line-clamp-2 text-xs text-zinc-500">
                    Laudo: {os.executionReport}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedId(os.id)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Inspecionar e liberar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOS && (
        <MachineReleaseModal
          os={selectedOS}
          releasedBy={releasedBy}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
