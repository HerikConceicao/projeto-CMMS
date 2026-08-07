import { useState } from 'react';
import type { OrderOfService, User } from '../../types';
import { Modal } from '../ui/Modal';

interface CloseOSModalProps {
  os: OrderOfService;
  releasers: User[];
  defaultReleaserId?: number;
  onConfirm: (value: { outcome: 'Concluído' | 'Cancelado'; releasedBy: string; notes: string }) => void;
  onClose: () => void;
}

type Outcome = 'Concluído' | 'Cancelado';

export function CloseOSModal({
  os,
  releasers,
  defaultReleaserId,
  onConfirm,
  onClose,
}: CloseOSModalProps) {
  const [outcome, setOutcome] = useState<Outcome>('Concluído');
  const [releaserId, setReleaserId] = useState<number | null>(
    defaultReleaserId ?? releasers[0]?.id ?? null,
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const releaser = releasers.find((u) => u.id === releaserId);
    if (!releaser) {
      setError('Selecione quem está liberando esta OS.');
      return;
    }
    if (!notes.trim()) {
      setError('Descreva uma observação sobre o encerramento.');
      return;
    }
    onConfirm({ outcome, releasedBy: releaser.name, notes: notes.trim() });
  };

  return (
    <Modal title={`Baixa manual · OS #${os.id}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-500">{os.assetName}</p>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Resultado</p>
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => setOutcome('Concluído')}
              className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
                outcome === 'Concluído'
                  ? 'bg-green-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Concluir
            </button>
            <button
              type="button"
              onClick={() => setOutcome('Cancelado')}
              className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
                outcome === 'Cancelado'
                  ? 'bg-red-500 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cancelar OS
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="releaser" className="mb-2 block text-sm font-medium text-zinc-300">
            Liberado por
          </label>
          {releasers.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum liberador ativo cadastrado.</p>
          ) : (
            <select
              id="releaser"
              value={releaserId ?? ''}
              onChange={(e) => {
                setReleaserId(Number(e.target.value));
                if (error) setError(null);
              }}
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              {releasers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="mb-2 block text-sm font-medium text-zinc-300">
            Observações
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (error) setError(null);
            }}
            rows={3}
            placeholder="Descreva o motivo do encerramento ou detalhes relevantes..."
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          className={`flex h-11 w-full items-center justify-center rounded-lg font-medium text-zinc-950 transition-colors ${
            outcome === 'Concluído' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'
          }`}
        >
          {outcome === 'Concluído' ? 'Confirmar conclusão' : 'Confirmar cancelamento'}
        </button>
      </div>
    </Modal>
  );
}
