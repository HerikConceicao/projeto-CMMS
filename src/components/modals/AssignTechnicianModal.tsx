import { useState } from 'react';
import { Check, Wrench } from 'lucide-react';
import type { OrderOfService, User } from '../../types';
import { Modal } from '../ui/Modal';

interface AssignTechnicianModalProps {
  os: OrderOfService;
  technicians: User[];
  onAssign: (technicianId: number) => void;
  onClose: () => void;
}

export function AssignTechnicianModal({
  os,
  technicians,
  onAssign,
  onClose,
}: AssignTechnicianModalProps) {
  const [selectedId, setSelectedId] = useState<number | null>(os.assignedTo ?? null);

  return (
    <Modal title={`Atribuir técnico · OS #${os.id}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-500">{os.assetName}</p>

        {technicians.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            Nenhum técnico ativo cadastrado no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {technicians.map((tech) => {
              const selected = selectedId === tech.id;
              return (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => setSelectedId(tech.id)}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-200">{tech.name}</span>
                  </span>
                  {selected && <Check className="h-4 w-4 text-orange-500" />}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={selectedId === null}
          onClick={() => selectedId !== null && onAssign(selectedId)}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          Confirmar atribuição
        </button>
      </div>
    </Modal>
  );
}
