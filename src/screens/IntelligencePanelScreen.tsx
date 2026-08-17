import { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Gauge,
  HeartPulse,
  Settings,
  Timer,
  Wallet,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { KpiCard } from '../components/intelligence/KpiCard';
import { BudgetChart } from '../components/intelligence/BudgetChart';
import { HealthDonutChart } from '../components/intelligence/HealthDonutChart';
import { ReplacementRankingTable } from '../components/intelligence/ReplacementRankingTable';
import { IndicatorsManualScreen } from './IndicatorsManualScreen';
import { FinancialSettingsScreen } from './FinancialSettingsScreen';
import { computeMaintenanceKpis } from '../utils/kpis';
import { buildMonthlySpend } from '../utils/financeSeries';
import { buildReplacementRanking } from '../utils/assetReplacement';
import { buildHealthDistribution } from '../utils/healthDistribution';
import { formatBRL } from '../utils/currency';
import { formatHours, formatPercent as formatPct } from '../utils/formatMetrics';

interface IntelligencePanelScreenProps {
  onExit: () => void;
}

export function IntelligencePanelScreen({ onExit }: IntelligencePanelScreenProps) {
  const { ordersOfService, validatedAssets, financialSettings, isDesktopMode } = useAppContext();
  const [showManual, setShowManual] = useState(false);
  const [showFinancialSettings, setShowFinancialSettings] = useState(false);

  if (showManual) {
    return <IndicatorsManualScreen onExit={() => setShowManual(false)} />;
  }

  if (showFinancialSettings) {
    return <FinancialSettingsScreen onExit={() => setShowFinancialSettings(false)} />;
  }

  const kpis = computeMaintenanceKpis(ordersOfService);
  const monthlySpend = buildMonthlySpend(ordersOfService, financialSettings.budgetMensal);
  const replacementRanking = buildReplacementRanking(validatedAssets, ordersOfService);
  const healthDistribution = buildHealthDistribution(validatedAssets);

  const currentMonthSpend = monthlySpend[monthlySpend.length - 1]?.gastoReal ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-6 p-4 sm:p-6 ${isDesktopMode ? 'max-w-5xl' : 'max-w-xl'}`}
      >
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Voltar ao início"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-base font-semibold text-zinc-100">Painel de Inteligência</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="hidden h-9 shrink-0 items-center gap-2 rounded-lg border border-zinc-800 px-3 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 sm:flex"
          >
            <BookOpen className="h-4 w-4" />
            Manual de Indicadores
          </button>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">
            Benchmarks e Metas de Saúde
          </h2>
          <div className={`grid gap-3 ${isDesktopMode ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <KpiCard
              icon={Activity}
              label="MTBF"
              value={formatHours(kpis.mtbfHours)}
              caption={`Confiabilidade · ${kpis.stopsCount} parada${kpis.stopsCount === 1 ? '' : 's'} no período`}
            />
            <KpiCard
              icon={Gauge}
              label="Disponibilidade"
              value={formatPct(kpis.availabilityPct)}
              caption="Tempo em produção vs. tempo parado"
            />
            <KpiCard
              icon={Timer}
              label="MTTR"
              value={formatHours(kpis.mttrHours)}
              caption={`Reparo · ${kpis.closedStopsCount} intervenção${kpis.closedStopsCount === 1 ? '' : 'ões'} encerrada${kpis.closedStopsCount === 1 ? '' : 's'}`}
            />
            <KpiCard
              icon={CalendarCheck}
              label="Aderência Preventiva"
              value={formatPct(kpis.preventiveAdherencePct)}
              caption={`${kpis.preventiveDone} de ${kpis.preventiveTotal} preventivas concluídas`}
            />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Wallet className="h-4 w-4 text-orange-500" />
              Finanças da Manutenção
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-zinc-500">
                Orçamento mensal: <span className="text-zinc-300">{formatBRL(financialSettings.budgetMensal)}</span>
                {' · '}Gasto no mês atual:{' '}
                <span
                  className={
                    currentMonthSpend > financialSettings.budgetMensal ? 'text-red-400' : 'text-zinc-300'
                  }
                >
                  {formatBRL(currentMonthSpend)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setShowFinancialSettings(true)}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
              >
                <Settings className="h-3.5 w-3.5" />
                Configurar
              </button>
            </div>
          </div>
          <BudgetChart data={monthlySpend} />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">
            Ranking de Substituição de Ativos (CAPEX/OPEX)
          </h2>
          <ReplacementRankingTable rows={replacementRanking} />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-400">
            <HeartPulse className="h-4 w-4 text-orange-500" />
            Distribuição de Saúde dos Ativos
          </h2>
          <HealthDonutChart data={healthDistribution} />
        </section>

        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 sm:hidden"
        >
          <BookOpen className="h-4 w-4" />
          Manual de Indicadores
        </button>
      </div>
    </div>
  );
}
