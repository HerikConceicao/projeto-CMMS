import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { RoleCost } from '../../types';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { formatBRL } from '../../utils/currency';

interface RoleCostManagerProps {
  roles: RoleCost[];
  onAdd: (name: string, hourlyRate: number) => void;
  onUpdate: (id: string, name: string, hourlyRate: number) => void;
  onDelete: (id: string) => void;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function RoleCostManager({ roles, onAdd, onUpdate, onDelete }: RoleCostManagerProps) {
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRate, setEditingRate] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isDuplicate = (name: string, ignoreId?: string) =>
    roles.some(
      (role) => role.id !== ignoreId && role.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

  const handleAdd = () => {
    const trimmed = newName.trim();
    const rate = Number(newRate);
    if (!trimmed) {
      setAddError('Informe o nome da função.');
      return;
    }
    if (isDuplicate(trimmed)) {
      setAddError('Já existe uma função com esse nome.');
      return;
    }
    if (!newRate || Number.isNaN(rate) || rate <= 0) {
      setAddError('Informe uma taxa horária válida.');
      return;
    }
    onAdd(trimmed, rate);
    setNewName('');
    setNewRate('');
    setAddError(null);
  };

  const startEdit = (role: RoleCost) => {
    setEditingId(role.id);
    setEditingName(role.name);
    setEditingRate(String(role.hourlyRate));
  };

  const confirmEdit = () => {
    if (editingId === null) return;
    const trimmed = editingName.trim();
    const rate = Number(editingRate);
    if (!trimmed || isDuplicate(trimmed, editingId) || !editingRate || Number.isNaN(rate) || rate <= 0) {
      return;
    }
    onUpdate(editingId, trimmed, rate);
    setEditingId(null);
  };

  const deleteItem = roles.find((role) => role.id === deleteId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (addError) setAddError(null);
            }}
            placeholder="Nome da função (ex: Técnico Pleno)"
            className="h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <div className="relative sm:w-40">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              R$
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={newRate}
              onChange={(e) => {
                setNewRate(e.target.value);
                if (addError) setAddError(null);
              }}
              placeholder="0,00 / h"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
        {addError && <p className="mt-1.5 text-sm text-red-500">{addError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {roles.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Nenhuma função cadastrada.</p>
        ) : (
          roles.map((role) => {
            const isEditing = editingId === role.id;
            return (
              <div key={role.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                {isEditing ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-10 flex-1 rounded-lg border border-orange-500 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none"
                    />
                    <div className="relative sm:w-36">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                        R$
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={editingRate}
                        onChange={(e) => setEditingRate(e.target.value)}
                        className="h-10 w-full rounded-lg border border-orange-500 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={confirmEdit}
                        aria-label="Salvar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-green-400 hover:bg-zinc-800"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancelar edição"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{role.name}</p>
                      <p className="text-xs text-zinc-500">{formatBRL(role.hourlyRate)} / hora</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(role)}
                      aria-label="Editar"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(role.id)}
                      aria-label="Excluir"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {deleteItem && (
        <ConfirmDialog
          title="Excluir função"
          message={`Tem certeza que deseja excluir "${deleteItem.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => onDelete(deleteItem.id)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

export { slugify };
