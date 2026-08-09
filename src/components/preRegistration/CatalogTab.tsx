import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export interface CatalogItem {
  id: number;
  name: string;
  count: number;
}

interface CatalogTabProps<T extends CatalogItem> {
  items: T[];
  addPlaceholder: string;
  emptyMessage: string;
  countLabel: (count: number) => string;
  onAdd: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  blockDeleteMessage?: (item: T) => string | null;
  renderExtra?: (item: T) => ReactNode;
}

export function CatalogTab<T extends CatalogItem>({
  items,
  addPlaceholder,
  emptyMessage,
  countLabel,
  onAdd,
  onRename,
  onDelete,
  blockDeleteMessage,
  renderExtra,
}: CatalogTabProps<T>) {
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [blockedMessageId, setBlockedMessageId] = useState<number | null>(null);

  const isDuplicate = (name: string, ignoreId?: number) =>
    items.some(
      (item) => item.id !== ignoreId && item.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setAddError('Informe um nome.');
      return;
    }
    if (isDuplicate(trimmed)) {
      setAddError('Já existe um item com esse nome.');
      return;
    }
    onAdd(trimmed);
    setNewName('');
    setAddError(null);
  };

  const startEdit = (item: T) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const confirmEdit = (item: T) => {
    const trimmed = editingName.trim();
    if (!trimmed || isDuplicate(trimmed, item.id)) {
      return;
    }
    onRename(item.id, trimmed);
    setEditingId(null);
  };

  const handleDeleteClick = (item: T) => {
    const blocked = blockDeleteMessage?.(item) ?? null;
    if (blocked) {
      setBlockedMessageId(item.id);
      return;
    }
    setBlockedMessageId(null);
    setDeleteId(item.id);
  };

  const deleteItem = items.find((item) => item.id === deleteId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (addError) setAddError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={addPlaceholder}
            className="h-11 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
        {addError && <p className="mt-1.5 text-sm text-red-500">{addError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">{emptyMessage}</p>
        ) : (
          items.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
              >
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && confirmEdit(item)}
                        className="h-10 flex-1 rounded-lg border border-orange-500 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => confirmEdit(item)}
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
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
                        <p className="text-xs text-zinc-500">
                          {countLabel(item.count)}
                          {renderExtra?.(item)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label="Editar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(item)}
                        aria-label="Excluir"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                {blockedMessageId === item.id && (
                  <p className="mt-2 text-xs text-red-400">{blockDeleteMessage?.(item)}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {deleteItem && (
        <ConfirmDialog
          title="Excluir item"
          message={`Tem certeza que deseja excluir "${deleteItem.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={() => onDelete(deleteItem.id)}
          onClose={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
