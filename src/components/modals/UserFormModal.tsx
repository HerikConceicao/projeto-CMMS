import { useState } from 'react';
import { Check } from 'lucide-react';
import type { User, UserPermissions, UserRole, UserStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { formatPhoneBR, isValidPhoneBR } from '../../utils/phone';
import { ROLE_PERMISSION_DEFAULTS, PERMISSION_LABELS } from '../../data/rolePermissionDefaults';

interface UserFormModalProps {
  user?: User;
  existingUsers: User[];
  onSave: (value: Omit<User, 'id' | 'osCreated' | 'osOpen'>) => void;
  onClose: () => void;
}

const ROLES: UserRole[] = ['Gestor', 'Técnico', 'Liberador', 'Operador'];

export function UserFormModal({ user, existingUsers, onSave, onClose }: UserFormModalProps) {
  const isEditing = !!user;

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<UserRole>(user?.role ?? 'Técnico');
  const [status, setStatus] = useState<UserStatus>(user?.status ?? 'Ativo');
  const [permissions, setPermissions] = useState<UserPermissions>(
    user?.permissions ?? ROLE_PERMISSION_DEFAULTS.Técnico,
  );
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setPermissions(ROLE_PERMISSION_DEFAULTS[nextRole]);
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Informe o nome do usuário.');
      return;
    }
    if (!isValidPhoneBR(phone)) {
      setError('Informe um telefone válido no formato (XX) XXXXX-XXXX.');
      return;
    }
    const phoneTaken = existingUsers.some((u) => u.id !== user?.id && u.phone === phone);
    if (phoneTaken) {
      setError('Já existe um usuário cadastrado com esse telefone.');
      return;
    }
    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Informe um e-mail válido ou deixe o campo em branco.');
      return;
    }

    onSave({
      name: trimmedName,
      phone,
      email: trimmedEmail || undefined,
      role,
      status,
      permissions,
    });
  };

  return (
    <Modal title={isEditing ? 'Editar usuário' : 'Novo usuário'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="user-name" className="mb-2 block text-sm font-medium text-zinc-300">
            Nome
          </label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Nome completo"
            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user-phone" className="mb-2 block text-sm font-medium text-zinc-300">
              Telefone
            </label>
            <input
              id="user-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhoneBR(e.target.value));
                if (error) setError(null);
              }}
              maxLength={15}
              placeholder="(11) 98888-0001"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="user-email" className="mb-2 block text-sm font-medium text-zinc-300">
              E-mail (opcional)
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="nome@empresa.com"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Função</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleRoleChange(option)}
                className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                  role === option
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Status</p>
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => setStatus('Ativo')}
              className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
                status === 'Ativo' ? 'bg-green-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Ativo
            </button>
            <button
              type="button"
              onClick={() => setStatus('Inativo')}
              className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
                status === 'Inativo' ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Inativo
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Permissões</p>
          <div className="flex flex-col gap-2">
            {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((key) => {
              const checked = !!permissions[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => togglePermission(key)}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                    checked
                      ? 'border-green-500/40 bg-green-500/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-green-500 bg-green-500 text-zinc-950' : 'border-zinc-600'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-sm text-zinc-200">{PERMISSION_LABELS[key]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
        >
          {isEditing ? 'Salvar alterações' : 'Criar usuário'}
        </button>
      </div>
    </Modal>
  );
}
