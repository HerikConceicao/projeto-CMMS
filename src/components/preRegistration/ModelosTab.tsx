import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Fabricante, Modelo } from '../../types';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface ModelosTabProps {
  modelos: Modelo[];
  fabricantes: Fabricante[];
  onAdd: (name: string, manufacturerId: number) => void;
  onRename: (id: number, name: string, manufacturerId: number) => void;
  onDelete: (id: number) => void;
}

export function ModelosTab({ modelos, fabricantes, onAdd, onRename, onDelete }: ModelosTabProps) {
  const [newName, setNewName] = useState('');
  const [newManufacturerId, setNewManufacturerId] = useState<number | ''>(fabricantes[0]?.id ?? '');
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingManufacturerId, setEditingManufacturerId] = useState<number | ''>('');

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const manufacturerName = (id: number) => fabricantes.find((f) => f.id === id)?.name ?? '—';

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError('Informe um nome.');
      return;
    }
    if (newManufacturerId === '') {
      setAddError('Selecione um fabricante.');
      return;
    }
    onAdd(trimmed, newManufacturerId);
    setNewName('');
    setAddError(null);
  };

  const startEdit = (modelo: Modelo) => {
    setEditingId(modelo.id);
    setEditingName(modelo.name);
    setEditingManufacturerId(modelo.manufacturerId);
  };

  const confirmEdit = () => {
    if (editingId === null || editingManufacturerId === '') return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    onRename(editingId, trimmed, editingManufacturerId);
    setEditingId(null);
  };

  const deleteItem = modelos.find((m) => m.id === deleteId);

  if (fabricantes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Cadastre um fabricante antes de adicionar modelos.
      </p>
    );
  }

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
            placeholder="Nome do modelo"
            className="h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <select
            value={newManufacturerId}
            onChange={(e) => setNewManufacturerId(Number(e.target.value))}
            className="h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            {fabricantes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
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
        {modelos.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">Nenhum modelo cadastrado.</p>
        ) : (
          modelos.map((modelo) => {
            const isEditing = editingId === modelo.id;
            return (
              <div key={modelo.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                {isEditing ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-10 flex-1 rounded-lg border border-orange-500 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none"
                    />
                    <select
                      value={editingManufacturerId}
                      onChange={(e) => setEditingManufacturerId(Number(e.target.value))}
                      className="h-10 rounded-lg border border-orange-500 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none"
                    >
                      {fabricantes.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
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
                      <p className="truncate text-sm font-medium text-zinc-100">{modelo.name}</p>
                      <p className="text-xs text-zinc-500">{manufacturerName(modelo.manufacturerId)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(modelo)}
                      aria-label="Editar"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(modelo.id)}
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
          title="Excluir modelo"
          message={`Tem certeza que deseja excluir "${deleteItem.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => onDelete(deleteItem.id)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
