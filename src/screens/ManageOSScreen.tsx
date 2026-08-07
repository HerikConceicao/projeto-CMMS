import { useState } from 'react';
import { ArrowLeft, ClipboardCheck, Search, User, UserPlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { OSDetailModal } from '../components/modals/OSDetailModal';
import { AssignTechnicianModal } from '../components/modals/AssignTechnicianModal';
import { CloseOSModal } from '../components/modals/CloseOSModal';
import { PRIORITY_LABELS, priorityClasses, statusClasses } from '../utils/badges';
import { formatDate } from '../utils/date';
import { matchesOSSearch } from '../utils/searchOrders';
import type { OSStatus } from '../types';

interface ManageOSScreenProps {
  onExit: () => void;
}

type Tab = 'pending' | 'completed';

const PENDING_STATUSES: OSStatus[] = ['Aberto', 'Em Andamento', 'Pendente Validação'];
const COMPLETED_STATUSES: OSStatus[] = ['Concluído', 'Cancelado'];

export function ManageOSScreen({ onExit }: ManageOSScreenProps) {
  const { ordersOfService, setOrdersOfService, users, currentUser, isDesktopMode } =
    useAppContext();

  const [tab, setTab] = useState<Tab>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [assignOSId, setAssignOSId] = useState<number | null>(null);
  const [closeOSId, setCloseOSId] = useState<number | null>(null);

  const technicians = users.filter((u) => u.role === 'Técnico' && u.status === 'Ativo');
  const releasers = users.filter(
    (u) => (u.role === 'Liberador' || u.role === 'Gestor') && u.status === 'Ativo',
  );

  const statusesForTab = tab === 'pending' ? PENDING_STATUSES : COMPLETED_STATUSES;
  const filtered = ordersOfService
    .filter((os) => statusesForTab.includes(os.status) && matchesOSSearch(os, searchTerm))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = ordersOfService.filter((os) => PENDING_STATUSES.includes(os.status)).length;
  const completedCount = ordersOfService.filter((os) =>
    COMPLETED_STATUSES.includes(os.status),
  ).length;

  const detailOS = ordersOfService.find((os) => os.id === detailId) ?? null;
  const assignOS = ordersOfService.find((os) => os.id === assignOSId) ?? null;
  const closeOS = ordersOfService.find((os) => os.id === closeOSId) ?? null;

  const defaultReleaserId =
    currentUser && releasers.some((u) => u.id === currentUser.id) ? currentUser.id : releasers[0]?.id;

  const handleAssign = (technicianId: number) => {
    setOrdersOfService((prev) =>
      prev.map((os) =>
        os.id === assignOSId
          ? { ...os, assignedTo: technicianId, status: os.status === 'Aberto' ? 'Em Andamento' : os.status }
          : os,
      ),
    );
    setAssignOSId(null);
  };

  const handleClose = (value: { outcome: 'Concluído' | 'Cancelado'; releasedBy: string; notes: string }) => {
    setOrdersOfService((prev) =>
      prev.map((os) =>
        os.id === closeOSId
          ? {
              ...os,
              status: value.outcome,
              closedAt: new Date().toISOString(),
              releasedBy: value.releasedBy,
              executionReport: value.notes,
            }
          : os,
      ),
    );
    setCloseOSId(null);
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
          <h1 className="text-base font-semibold text-zinc-100">Gestão de Ordem de Serviço</h1>
        </header>

        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
              tab === 'pending' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setTab('completed')}
            className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
              tab === 'completed' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, máquina, setor ou TAG"
            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              Nenhuma ordem de serviço encontrada.
            </p>
          ) : (
            filtered.map((os) => (
              <div
                key={os.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
              >
                <button
                  type="button"
                  onClick={() => setDetailId(os.id)}
                  className="flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-zinc-800"
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
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${statusClasses(os.status)}`}
                    >
                      {os.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${priorityClasses(os.priority)}`}
                    >
                      {PRIORITY_LABELS[os.priority]}
                    </span>
                    <span className="text-xs text-zinc-500">{os.type}</span>
                    <span className="text-xs text-zinc-600">{formatDate(os.createdAt)}</span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <User className="h-3 w-3" />
                      {os.assignedTo
                        ? (users.find((u) => u.id === os.assignedTo)?.name ?? 'Técnico')
                        : 'Não atribuído'}
                    </span>
                  </div>
                </button>

                {tab === 'pending' && (
                  <div className="flex divide-x divide-zinc-800 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setAssignOSId(os.id)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <UserPlus className="h-4 w-4" />
                      {os.assignedTo ? 'Reatribuir' : 'Atribuir técnico'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloseOSId(os.id)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Baixa manual
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {detailOS && (
        <OSDetailModal
          os={detailOS}
          assignedToName={users.find((u) => u.id === detailOS.assignedTo)?.name}
          onClose={() => setDetailId(null)}
        />
      )}

      {assignOS && (
        <AssignTechnicianModal
          os={assignOS}
          technicians={technicians}
          onAssign={handleAssign}
          onClose={() => setAssignOSId(null)}
        />
      )}

      {closeOS && (
        <CloseOSModal
          os={closeOS}
          releasers={releasers}
          defaultReleaserId={defaultReleaserId}
          onConfirm={handleClose}
          onClose={() => setCloseOSId(null)}
        />
      )}
    </div>
  );
}
