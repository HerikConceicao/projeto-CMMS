import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, Lock, Mail, UserPlus, Wrench } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const { login, signUpFirstAccess } = useAppContext();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setConfirmPassword('');
    resetMessages();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setIsSubmitting(true);
    const errorMessage =
      mode === 'login'
        ? await login(email.trim(), password)
        : await signUpFirstAccess(email.trim(), password);
    setIsSubmitting(false);

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    if (mode === 'signup') {
      setInfo('Conta criada! Verifique seu e-mail para confirmar o acesso e depois faça login.');
      switchMode('login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
            <Wrench className="h-6 w-6 text-zinc-950" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">CMMS / EAM</h1>
          <p className="text-sm text-zinc-500">Gestão de Ativos & Manutenção</p>
        </div>

        <div className="mb-6 flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Primeiro acesso
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <p className="mb-4 text-xs text-zinc-500">
              Use o mesmo e-mail que o gestor cadastrou para você em "Gerenciar Usuários" e crie
              uma senha de acesso.
            </p>
          )}

          <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
            E-mail
          </label>
          <div className="relative mb-4">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetMessages();
              }}
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
            Senha
          </label>
          <div className="relative mb-4">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                resetMessages();
              }}
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {mode === 'signup' && (
            <>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Confirmar senha
              </label>
              <div className="relative mb-4">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    resetMessages();
                  }}
                  className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </>
          )}

          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          {info && <p className="mb-4 text-sm text-green-500">{info}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-medium text-zinc-950 transition-colors hover:bg-orange-400 disabled:opacity-60"
          >
            {isSubmitting
              ? 'Aguarde...'
              : mode === 'login'
                ? 'Entrar'
                : 'Criar senha de acesso'}
          </button>
        </form>
      </div>
    </div>
  );
}
