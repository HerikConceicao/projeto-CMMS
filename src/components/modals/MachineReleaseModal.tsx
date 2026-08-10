import { useState } from 'react';
import { Check, ShieldCheck, ShieldX } from 'lucide-react';
import type { OrderOfService } from '../../types';
import { Modal } from '../ui/Modal';
import { InfoRow } from '../ui/InfoRow';
import { RELEASE_CHECKLIST_ITEMS } from '../../data/releaseChecklist';

interface MachineReleaseModalProps {
  os: OrderOfService;
  releasedBy: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}

type Decision = 'approve' | 'reject';

export function MachineReleaseModal({
  os,
  releasedBy,
  onApprove,
  onReject,
  onClose,
}: MachineReleaseModalProps) {
  const [decision, setDecision] = useState<Decision>('approve');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggle = (item: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const allChecked = checked.size === RELEASE_CHECKLIST_ITEMS.length;

  const handleSubmit = () => {
    if (decision === 'approve') {
      if (!allChecked) {
        setError('Confirme todos os itens do checklist antes de liberar a máquina.');
        return;
      }
      onApprove();
    } else {
      if (!reason.trim()) {
        setError('Descreva o motivo da rejeição.');
        return;
      }
      onReject(reason.trim());
    }
  };

  return (
    <Modal title={`Liberação de Máquina · OS #${os.id}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-100">{os.assetName}</p>
          <p className="text-xs text-zinc-500">
            {os.assetNumber} · {os.sector}
          </p>
        </div>

        <div>
          <InfoRow label="Liberado por" value={releasedBy} />
          {os.horimeterStart !== undefined && (
            <InfoRow label="Horímetro inicial" value={String(os.horimeterStart)} />
          )}
          {os.horimeterEnd !== undefined && (
            <InfoRow label="Horímetro final" value={String(os.horimeterEnd)} />
          )}
        </div>

        {os.executionReport && (
          <div>
            <p className="mb-1 text-sm font-medium text-zinc-300">Laudo técnico</p>
            <p className="whitespace-pre-wrap rounded-lg bg-zinc-950 p-3 text-sm text-zinc-400">
              {os.executionReport}
            </p>
          </div>
        )}

        <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => {
              setDecision('approve');
              setError(null);
            }}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
              decision === 'approve'
                ? 'bg-green-500 text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Aprovar
          </button>
          <button
            type="button"
            onClick={() => {
              setDecision('reject');
              setError(null);
            }}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
              decision === 'reject' ? 'bg-red-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldX className="h-4 w-4" />
            Rejeitar
          </button>
        </div>

        {decision === 'approve' ? (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Checklist de liberação</p>
            <div className="flex flex-col gap-2">
              {RELEASE_CHECKLIST_ITEMS.map((item) => {
                const isChecked = checked.has(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      toggle(item);
                      if (error) setError(null);
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isChecked
                        ? 'border-green-500/40 bg-green-500/10'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isChecked ? 'border-green-500 bg-green-500 text-zinc-950' : 'border-zinc-600'
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="text-sm text-zinc-200">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="reject-reason" className="mb-2 block text-sm font-medium text-zinc-300">
              Motivo da rejeição
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              rows={3}
              placeholder="Descreva o que precisa ser corrigido antes de liberar a máquina..."
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          className={`flex h-11 w-full items-center justify-center rounded-lg font-medium text-zinc-950 transition-colors ${
            decision === 'approve' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'
          }`}
        >
          {decision === 'approve' ? 'Aprovar e liberar máquina' : 'Confirmar rejeição'}
        </button>
      </div>
    </Modal>
  );
}
