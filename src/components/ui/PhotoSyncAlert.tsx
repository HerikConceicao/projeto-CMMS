import { AlertTriangle, X } from 'lucide-react';

interface PhotoSyncAlertProps {
  messages: string[];
  onDismiss: () => void;
}

// Aviso persistente (até o usuário dispensar) de falhas ao salvar/remover fotos.
// Fica fixo na tela porque a tela que disparou o salvamento normalmente já
// mostrou "sucesso" e seguiu em frente quando o upload termina.
export function PhotoSyncAlert({ messages, onDismiss }: PhotoSyncAlertProps) {
  if (messages.length === 0) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-t-xl border border-red-500/40 bg-zinc-900 p-4 shadow-lg"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div className="flex flex-1 flex-col gap-1 text-sm text-zinc-300">
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
