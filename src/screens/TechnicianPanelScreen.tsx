import { useState } from 'react';
import { ArrowLeft, Clock3, Octagon, PlayCircle, TriangleAlert } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { TechnicianExecutionScreen } from './TechnicianExecutionScreen';
import { OSDetailModal } from '../components/modals/OSDetailModal';
import { PRIORITY_LABELS, priorityClasses } from '../utils/badges';
import { formatDate } from '../utils/date';
import type { OSPriority } from '../types';

interface TechnicianPanelScreenProps {
  onExit: () => void;
}

const PRIORITY_WEIGHT: Record<OSPriority, number> = {
  urgente: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export function TechnicianPanelScreen({ onExit }: TechnicianPanelScreenProps) {
  const { ordersOfService, currentUser, isDesktopMode } = useAppContext();
  const [executingOSId, setExecutingOSId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const myOrders = ordersOfService.filter((os) => os.assignedTo === currentUser?.id);
  const activeQueue = myOrders
    .filter((os) => os.status === 'Aberto' || os.status === 'Em Andamento')
    .sort(
      (a, b) =>
        PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const awaitingValidation = myOrders.filter((os) => os.status === 'Pendente Validação');

  const executingOS = myOrders.find((os) => os.id === executingOSId) ?? null;
  const detailOS = myOrders.find((os) => os.id === detailId) ?? null;

  if (executingOS) {
    return <TechnicianExecutionScreen os={executingOS} onExit={() => setExecutingOSId(null)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-6 p-4 sm:p-6 ${isDesktopMode ? 'max-w-4xl' : 'max-w-xl'}`}
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
          <h1 className="text-base font-semibold text-zinc-100">Painel do Técnico</h1>
        </header>

        {myOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            Nenhuma ordem de serviço atribuída a você no momento.
          </p>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-sm font-medium text-zinc-400">
                Minhas Ordens de Serviço ({activeQueue.length})
              </h2>
              {activeQueue.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhuma OS pendente de execução.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeQueue.map((os) => (
                    <button
                      key={os.id}
                      type="button"
                      onClick={() => setExecutingOSId(os.id)}
                      className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-orange-500/50 hover:bg-zinc-800"
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
                        <span
                          className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
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

                      <p className="line-clamp-2 text-xs text-zinc-500">{os.description}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${priorityClasses(os.priority)}`}
                        >
                          {PRIORITY_LABELS[os.priority]}
                        </span>
                        <span className="text-xs text-zinc-500">{os.type}</span>
                        <span className="text-xs text-zinc-600">{formatDate(os.createdAt)}</span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-orange-400">
                        <PlayCircle className="h-3.5 w-3.5" />
                        Iniciar atendimento
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {awaitingValidation.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-zinc-400">
                  Aguardando Validação ({awaitingValidation.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {awaitingValidation.map((os) => (
                    <button
                      key={os.id}
                      type="button"
                      onClick={() => setDetailId(os.id)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-700"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          #{os.id} · {os.assetName}
                        </p>
                        <p className="text-xs text-zinc-500">{os.assetNumber}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-amber-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        Aguardando liberação
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {detailOS && <OSDetailModal os={detailOS} onClose={() => setDetailId(null)} />}
    </div>
  );
}
