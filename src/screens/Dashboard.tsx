import { AlertTriangle, CheckCircle2, LogOut, Monitor, Smartphone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { QUICK_ACTIONS } from '../data/navigation';
import type { ScreenId } from '../types';

interface DashboardProps {
  onNavigate: (screen: ScreenId) => void;
}

function formatToday() {
  const label = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { currentUser, logout, isDesktopMode, setIsDesktopMode, ordersOfService } =
    useAppContext();

  const firstName = currentUser?.name.split(' ')[0] ?? '';
  const pendingValidation = ordersOfService.filter((os) => os.status === 'Pendente Validação');

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-6 p-4 transition-[max-width] duration-200 sm:p-6 ${
          isDesktopMode ? 'max-w-7xl' : 'max-w-xl'
        }`}
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Olá, {firstName}!</h1>
            <p className="text-sm text-zinc-500">{formatToday()}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span className="hidden sm:inline">Auto-save Ativo</span>
            </div>

            <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setIsDesktopMode(false)}
                aria-pressed={!isDesktopMode}
                aria-label="Modo Celular"
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  !isDesktopMode ? 'bg-orange-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsDesktopMode(true)}
                aria-pressed={isDesktopMode}
                aria-label="Modo Computador"
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  isDesktopMode ? 'bg-orange-500 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={logout}
              aria-label="Sair"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {pendingValidation.length > 0 ? (
          <section className="flex flex-col items-start gap-3 rounded-xl border border-orange-500/40 bg-orange-500/10 p-4 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 shrink-0 text-orange-500" />
            <div className="flex-1">
              <p className="font-medium text-zinc-100">
                {pendingValidation.length} ordem
                {pendingValidation.length > 1 ? 's' : ''} de serviço aguardando validação
              </p>
              <p className="text-sm text-zinc-400">
                Revise a execução antes de liberar a máquina de volta à produção.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('manage-os')}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400 sm:w-auto"
            >
              Resolver agora
            </button>
          </section>
        ) : (
          <section className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
            <p className="text-sm text-zinc-400">Nenhuma OS pendente de validação no momento.</p>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Ações Rápidas</h2>
          <div
            className={`grid gap-3 ${isDesktopMode ? 'grid-cols-3 lg:grid-cols-4' : 'grid-cols-2'}`}
          >
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.id)}
                className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center transition-colors hover:border-orange-500/50 hover:bg-zinc-800"
              >
                <action.icon className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-zinc-300">{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
