import { ArrowLeft, Camera, ClipboardCheck, Clock3, FileText, Gauge, Wrench } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { KpiCard } from '../components/intelligence/KpiCard';
import { TechnicianPerformanceTable } from '../components/audit/TechnicianPerformanceTable';
import { computeResponseMetrics, computeTechnicianPerformance, computeFillQuality } from '../utils/auditMetrics';
import { formatHours, formatPercent } from '../utils/formatMetrics';

interface AuditScreenProps {
  onExit: () => void;
}

export function AuditScreen({ onExit }: AuditScreenProps) {
  const { ordersOfService, users, isDesktopMode } = useAppContext();

  const responseMetrics = computeResponseMetrics(ordersOfService);
  const technicianRows = computeTechnicianPerformance(users, ordersOfService);
  const fillQuality = computeFillQuality(ordersOfService);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-6 p-4 sm:p-6 ${isDesktopMode ? 'max-w-5xl' : 'max-w-xl'}`}
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
          <h1 className="text-base font-semibold text-zinc-100">Auditoria Forense</h1>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Métricas de Resposta</h2>
          <div className={`grid gap-3 ${isDesktopMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <KpiCard
              icon={Clock3}
              label="Tempo de Atendimento"
              value={formatHours(responseMetrics.attendanceHours)}
              caption={`Abertura até chegada do técnico · ${responseMetrics.attendanceCount} OS${responseMetrics.attendanceCount === 1 ? '' : 's'} com registro`}
            />
            <KpiCard
              icon={Wrench}
              label="Tempo de Reparo"
              value={formatHours(responseMetrics.repairHours)}
              caption={`Chegada até encerramento · ${responseMetrics.repairCount} OS${responseMetrics.repairCount === 1 ? '' : 's'} encerrada${responseMetrics.repairCount === 1 ? '' : 's'}`}
            />
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">Ranking de Performance Técnica</h2>
          <p className="mb-4 text-xs text-zinc-500">
            "Sem reincidência" conta as OSs concluídas cujo ativo não abriu uma nova ordem nos 30 dias
            seguintes ao encerramento.
          </p>
          <TechnicianPerformanceTable rows={technicianRows} />
        </section>

        <section>
          <h2 className="mb-1 text-sm font-medium text-zinc-400">Qualidade de Preenchimento</h2>
          <p className="mb-3 text-xs text-zinc-500">
            Avalia o rigor de {fillQuality.scoredCount} OS
            {fillQuality.scoredCount === 1 ? '' : 's'} já executada
            {fillQuality.scoredCount === 1 ? '' : 's'}: laudo com conteúdo mínimo, horímetro
            inicial/final coerente e fotos anexadas.
          </p>
          <div className={`grid gap-3 ${isDesktopMode ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <KpiCard
              icon={ClipboardCheck}
              label="Nota Geral"
              value={formatPercent(fillQuality.overallScorePct)}
              caption="Média do rigor de preenchimento"
            />
            <KpiCard
              icon={FileText}
              label="Laudos Completos"
              value={formatPercent(fillQuality.reportCompletePct)}
              caption="Relatórios com conteúdo mínimo"
            />
            <KpiCard
              icon={Gauge}
              label="Horímetros Completos"
              value={formatPercent(fillQuality.horimeterCompletePct)}
              caption="Início e fim registrados e coerentes"
            />
            <KpiCard
              icon={Camera}
              label="Com Fotos"
              value={formatPercent(fillQuality.photosPct)}
              caption="OSs com fotos de execução anexadas"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
