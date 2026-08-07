import { useState } from 'react';
import { ArrowLeft, Search, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { OSDetailModal } from '../components/modals/OSDetailModal';
import { PRIORITY_LABELS, priorityClasses, statusClasses } from '../utils/badges';
import { formatDate } from '../utils/date';
import { matchesOSSearch } from '../utils/searchOrders';
import type { OSStatus } from '../types';

interface OSListScreenProps {
  onExit: () => void;
}

type StatusFilter = OSStatus | 'Todos';

const ALL_STATUSES: OSStatus[] = [
  'Aberto',
  'Em Andamento',
  'Pendente Validação',
  'Concluído',
  'Cancelado',
];

export function OSListScreen({ onExit }: OSListScreenProps) {
  const { ordersOfService, users, isDesktopMode } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const sorted = [...ordersOfService].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const filtered = sorted.filter(
    (os) =>
      (statusFilter === 'Todos' || os.status === statusFilter) && matchesOSSearch(os, searchTerm),
  );

  const selectedOS = ordersOfService.find((os) => os.id === selectedId) ?? null;
  const assignedToName = selectedOS
    ? users.find((u) => u.id === selectedOS.assignedTo)?.name
    : undefined;

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
          <h1 className="text-base font-semibold text-zinc-100">Lista de Ordens de Serviço</h1>
        </header>

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

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Todos', ...ALL_STATUSES] as StatusFilter[]).map((status) => {
            const count =
              status === 'Todos'
                ? ordersOfService.length
                : ordersOfService.filter((os) => os.status === status).length;
            const selected = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {status}
                <span className="text-xs text-zinc-500">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">
              Nenhuma ordem de serviço encontrada.
            </p>
          ) : (
            filtered.map((os) => (
              <button
                key={os.id}
                type="button"
                onClick={() => setSelectedId(os.id)}
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
                  {os.assignedTo && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <User className="h-3 w-3" />
                      {users.find((u) => u.id === os.assignedTo)?.name ?? 'Técnico'}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedOS && (
        <OSDetailModal
          os={selectedOS}
          assignedToName={assignedToName}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
