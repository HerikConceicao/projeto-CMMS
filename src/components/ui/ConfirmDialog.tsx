import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-400">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium text-zinc-950 transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-400' : 'bg-orange-500 hover:bg-orange-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
