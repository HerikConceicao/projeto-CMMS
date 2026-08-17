import { useState } from 'react';
import { ArrowLeft, Mail, Pencil, Phone, Power, Search, Trash2, UserPlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UserFormModal } from '../components/modals/UserFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { userRoleClasses, userStatusClasses } from '../utils/badges';
import type { User, UserRole } from '../types';

interface ManageUsersScreenProps {
  onExit: () => void;
}

type RoleFilter = UserRole | 'Todos';

const ROLES: UserRole[] = ['Gestor', 'Técnico', 'Liberador', 'Operador'];

function nextUserId(users: User[]): number {
  return (users.length > 0 ? Math.max(...users.map((u) => u.id)) : 0) + 1;
}

export function ManageUsersScreen({ onExit }: ManageUsersScreenProps) {
  const { users, setUsers, ordersOfService, currentUser, isDesktopMode } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('Todos');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [blockedMessageId, setBlockedMessageId] = useState<number | null>(null);

  const filtered = users.filter((user) => {
    const matchesRole = roleFilter === 'Todos' || user.role === roleFilter;
    const needle = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      user.name.toLowerCase().includes(needle) ||
      user.phone.includes(needle) ||
      (user.email?.toLowerCase().includes(needle) ?? false);
    return matchesRole && matchesSearch;
  });

  const blockDeleteMessage = (user: User): string | null => {
    if (user.id === currentUser?.id) return 'Você não pode excluir o próprio usuário logado.';
    if (ordersOfService.some((os) => os.assignedTo === user.id)) {
      return 'Este usuário tem OSs atribuídas. Desative-o em vez de excluir.';
    }
    return null;
  };

  const handleDeleteClick = (user: User) => {
    const blocked = blockDeleteMessage(user);
    if (blocked) {
      setBlockedMessageId(user.id);
      return;
    }
    setBlockedMessageId(null);
    setDeleteId(user.id);
  };

  const toggleStatus = (user: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: u.status === 'Ativo' ? 'Inativo' : 'Ativo' } : u)),
    );
  };

  const handleSave = (value: Omit<User, 'id' | 'osCreated' | 'osOpen'>) => {
    if (formMode === 'edit' && editingUser) {
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...value } : u)));
    } else {
      setUsers((prev) => [
        ...prev,
        { id: nextUserId(prev), osCreated: 0, osOpen: 0, ...value },
      ]);
    }
    setFormMode(null);
    setEditingUser(null);
  };

  const deleteUser = users.find((u) => u.id === deleteId);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-5 p-4 sm:p-6 ${isDesktopMode ? 'max-w-4xl' : 'max-w-xl'}`}
      >
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Voltar ao início"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-base font-semibold text-zinc-100">Gerenciar Usuários</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setFormMode('create');
            }}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
          >
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </button>
        </header>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail"
            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Todos', ...ROLES] as RoleFilter[]).map((role) => {
            const selected = roleFilter === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">Nenhum usuário encontrado.</p>
          ) : (
            filtered.map((user) => (
              <div key={user.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${userRoleClasses(user.role)}`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${userStatusClasses(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </span>
                  {user.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                  )}
                  {user.osOpen !== undefined && <span>{user.osOpen} OS em aberto</span>}
                </div>

                <div className="mt-3 flex divide-x divide-zinc-800 border-t border-zinc-800 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(user)}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    <Power className="h-3.5 w-3.5" />
                    {user.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(user);
                      setFormMode('edit');
                    }}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(user)}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>

                {blockedMessageId === user.id && (
                  <p className="mt-2 text-xs text-red-400">{blockDeleteMessage(user)}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {formMode && (
        <UserFormModal
          user={editingUser ?? undefined}
          existingUsers={users}
          onSave={handleSave}
          onClose={() => {
            setFormMode(null);
            setEditingUser(null);
          }}
        />
      )}

      {deleteUser && (
        <ConfirmDialog
          title="Excluir usuário"
          message={`Tem certeza que deseja excluir "${deleteUser.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
