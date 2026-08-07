import { useState } from 'react';
import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StepIndicator } from '../components/ui/StepIndicator';
import { AssetIdentificationStep } from '../components/wizards/OpenOS/AssetIdentificationStep';
import { AssetConfirmationStep } from '../components/wizards/OpenOS/AssetConfirmationStep';
import {
  ProblemDetailsStep,
  type ProblemDetailsValue,
} from '../components/wizards/OpenOS/ProblemDetailsStep';
import { PRIORITY_LABELS, priorityClasses } from '../utils/badges';
import type { Asset, OrderOfService } from '../types';

interface OpenOSScreenProps {
  onExit: () => void;
}

type WizardStep = 'identify' | 'confirm' | 'details' | 'success';

const STEP_LABELS = ['Identificação', 'Confirmação', 'Detalhamento'];
const STEP_INDEX: Record<WizardStep, number> = {
  identify: 0,
  confirm: 1,
  details: 2,
  success: 3,
};

export function OpenOSScreen({ onExit }: OpenOSScreenProps) {
  const { validatedAssets, problemas, ordersOfService, setOrdersOfService, currentUser, isDesktopMode } =
    useAppContext();

  const [step, setStep] = useState<WizardStep>('identify');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [createdOS, setCreatedOS] = useState<OrderOfService | null>(null);

  const resetWizard = () => {
    setSelectedAsset(null);
    setCreatedOS(null);
    setStep('identify');
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setStep('confirm');
  };

  const handleSubmitDetails = (value: ProblemDetailsValue) => {
    if (!selectedAsset) return;

    const nextId = Math.max(1022, ...ordersOfService.map((os) => os.id)) + 1;
    const description =
      value.symptoms.length > 0
        ? `Sintomas: ${value.symptoms.join(', ')}. ${value.description}`
        : value.description;

    const newOS: OrderOfService = {
      id: nextId,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      assetNumber: selectedAsset.assetNumber,
      sector: selectedAsset.sector,
      priority: value.priority,
      status: 'Aberto',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name ?? 'Desconhecido',
      type: value.type,
      description,
      reportPhotos: value.photos.length > 0 ? value.photos : undefined,
      isMachineStopped: value.isMachineStopped,
    };

    setOrdersOfService((prev) => [...prev, newOS]);
    setCreatedOS(newOS);
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
            aria-label="Cancelar e voltar ao início"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            {step === 'success' ? <ArrowLeft className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
          <h1 className="text-base font-semibold text-zinc-100">Abrir Ordem de Serviço</h1>
          <div className="w-9" />
        </header>

        {step !== 'success' && (
          <StepIndicator steps={STEP_LABELS} currentIndex={STEP_INDEX[step]} />
        )}

        {step === 'identify' && (
          <AssetIdentificationStep assets={validatedAssets} onSelect={handleSelectAsset} />
        )}

        {step === 'confirm' && selectedAsset && (
          <AssetConfirmationStep
            asset={selectedAsset}
            onConfirm={() => setStep('details')}
            onChangeAsset={() => {
              setSelectedAsset(null);
              setStep('identify');
            }}
          />
        )}

        {step === 'details' && (
          <ProblemDetailsStep
            problemas={problemas}
            onBack={() => setStep('confirm')}
            onSubmit={handleSubmitDetails}
          />
        )}

        {step === 'success' && createdOS && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                OS #{createdOS.id} aberta com sucesso!
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{createdOS.assetName}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs ${priorityClasses(createdOS.priority)}`}
            >
              Prioridade {PRIORITY_LABELS[createdOS.priority]}
            </span>

            <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={resetWizard}
                className="flex h-11 flex-1 items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Abrir outra OS
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex h-11 flex-1 items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
