import { useState } from 'react';
import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StepIndicator } from '../components/ui/StepIndicator';
import { PreMaintenanceChecklist } from '../components/wizards/TechnicianExecution/PreMaintenanceChecklist';
import {
  ExecutionStep,
  type ExecutionStepValue,
} from '../components/wizards/TechnicianExecution/ExecutionStep';
import { QrFinishScanStep } from '../components/wizards/TechnicianExecution/QrFinishScanStep';
import type { OrderOfService } from '../types';

interface TechnicianExecutionScreenProps {
  os: OrderOfService;
  onExit: () => void;
}

type WizardStep = 'checklist' | 'execution' | 'qrscan' | 'success';

const STEP_LABELS = ['Pré-Manutenção', 'Execução', 'Confirmação'];
const STEP_INDEX: Record<WizardStep, number> = {
  checklist: 0,
  execution: 1,
  qrscan: 2,
  success: 3,
};

export function TechnicianExecutionScreen({ os, onExit }: TechnicianExecutionScreenProps) {
  const { setOrdersOfService, isDesktopMode } = useAppContext();
  const [step, setStep] = useState<WizardStep>('checklist');
  const [executionData, setExecutionData] = useState<ExecutionStepValue | null>(null);

  const handleExecutionSubmit = (value: ExecutionStepValue) => {
    setExecutionData(value);
    setStep('qrscan');
  };

  const handleQrConfirm = () => {
    if (!executionData) return;
    setOrdersOfService((prev) =>
      prev.map((order) =>
        order.id === os.id
          ? {
              ...order,
              status: 'Pendente Validação',
              horimeterStart: executionData.horimeterStart,
              horimeterEnd: executionData.horimeterEnd,
              executionReport: executionData.executionReport,
              executionPhotos:
                executionData.executionPhotos.length > 0 ? executionData.executionPhotos : undefined,
            }
          : order,
      ),
    );
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-6 p-4 sm:p-6 ${isDesktopMode ? 'max-w-3xl' : 'max-w-xl'}`}
      >
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            aria-label="Voltar ao painel"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            {step === 'success' ? <ArrowLeft className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
          <div className="text-center">
            <h1 className="text-base font-semibold text-zinc-100">OS #{os.id}</h1>
            <p className="text-xs text-zinc-500">{os.assetName}</p>
          </div>
          <div className="w-9" />
        </header>

        {step !== 'success' && (
          <StepIndicator steps={STEP_LABELS} currentIndex={STEP_INDEX[step]} />
        )}

        {step === 'checklist' && (
          <PreMaintenanceChecklist onConfirm={() => setStep('execution')} />
        )}

        {step === 'execution' && <ExecutionStep onSubmit={handleExecutionSubmit} />}

        {step === 'qrscan' && (
          <QrFinishScanStep
            assetName={os.assetName}
            expectedAssetNumber={os.assetNumber}
            onConfirm={handleQrConfirm}
          />
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Execução registrada!</h2>
              <p className="mt-1 text-sm text-zinc-500">
                A OS #{os.id} foi enviada para validação do liberador.
              </p>
            </div>
            <button
              type="button"
              onClick={onExit}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
            >
              Voltar ao Painel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
