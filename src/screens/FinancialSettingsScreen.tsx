import { useState } from 'react';
import type { FocusEvent } from 'react';
import { ArrowLeft, Info, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RoleCostManager, slugify } from '../components/financial/RoleCostManager';
import { formatBRL } from '../utils/currency';

interface FinancialSettingsScreenProps {
  onExit: () => void;
}

function nextRoleId(name: string, existingIds: string[]): string {
  const base = slugify(name);
  if (!existingIds.includes(base)) return base;
  let suffix = 2;
  while (existingIds.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function FinancialSettingsScreen({ onExit }: FinancialSettingsScreenProps) {
  const { financialSettings, setFinancialSettings, isDesktopMode } = useAppContext();

  const [budgetInput, setBudgetInput] = useState(String(financialSettings.budgetMensal));
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const commitBudget = (event: FocusEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!event.target.value.trim() || Number.isNaN(value) || value < 0) {
      setBudgetError('Informe um valor de orçamento válido.');
      setBudgetInput(String(financialSettings.budgetMensal));
      return;
    }
    setBudgetError(null);
    setFinancialSettings((prev) => ({ ...prev, budgetMensal: value }));
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-6 p-4 sm:p-6 ${isDesktopMode ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Voltar ao início"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold text-zinc-100">Configurações Financeiras</h1>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Wallet className="h-4 w-4 text-orange-500" />
            Orçamento Mensal
          </h2>
          <p className="mb-3 text-xs text-zinc-500">
            Teto de gasto mensal com manutenção, usado como referência no Painel de Inteligência.
          </p>
          <div className="relative max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
              R$
            </span>
            <input
              type="number"
              min={0}
              step="100"
              inputMode="decimal"
              value={budgetInput}
              onChange={(e) => {
                setBudgetInput(e.target.value);
                if (budgetError) setBudgetError(null);
              }}
              onBlur={commitBudget}
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {budgetError ? (
            <p className="mt-1.5 text-sm text-red-500">{budgetError}</p>
          ) : (
            <p className="mt-1.5 text-xs text-zinc-600">Atual: {formatBRL(financialSettings.budgetMensal)}</p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Custo de Mão de Obra por Função</h2>

          <div className="mb-4 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <p className="text-xs text-zinc-500">
              Crie uma função para cada faixa salarial (ex: Técnico Júnior, Técnico Pleno, Técnico
              Sênior) em vez de uma função genérica única — isso torna o custo de mão de obra por OS
              mais preciso.
            </p>
          </div>

          <RoleCostManager
            roles={financialSettings.roles}
            onAdd={(name, hourlyRate) =>
              setFinancialSettings((prev) => ({
                ...prev,
                roles: [
                  ...prev.roles,
                  { id: nextRoleId(name, prev.roles.map((r) => r.id)), name, hourlyRate },
                ],
              }))
            }
            onUpdate={(id, name, hourlyRate) =>
              setFinancialSettings((prev) => ({
                ...prev,
                roles: prev.roles.map((role) =>
                  role.id === id ? { ...role, name, hourlyRate } : role,
                ),
              }))
            }
            onDelete={(id) =>
              setFinancialSettings((prev) => ({
                ...prev,
                roles: prev.roles.filter((role) => role.id !== id),
              }))
            }
          />
        </section>
      </div>
    </div>
  );
}
