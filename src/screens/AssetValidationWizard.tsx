import { useState } from 'react';
import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { StepIndicator } from '../components/ui/StepIndicator';
import { ClassificationStep } from '../components/wizards/AssetValidation/ClassificationStep';
import { TechSpecsStep } from '../components/wizards/AssetValidation/TechSpecsStep';
import { LocationCriticalityStep } from '../components/wizards/AssetValidation/LocationCriticalityStep';
import { HealthScoreStep } from '../components/wizards/AssetValidation/HealthScoreStep';
import { InventoryTagStep } from '../components/wizards/AssetValidation/InventoryTagStep';
import { QrLabelStep } from '../components/wizards/AssetValidation/QrLabelStep';
import { generateAssetTag } from '../utils/assetTag';
import type { Asset, AssetCriticality } from '../types';

interface AssetValidationWizardProps {
  asset: Asset;
  onExit: () => void;
}

type WizardStep =
  | 'classification'
  | 'tech-specs'
  | 'location'
  | 'health'
  | 'inventory'
  | 'label'
  | 'success';

const STEP_LABELS = ['Classificação', 'Especificações', 'Localização', 'Saúde', 'Inventário', 'Etiqueta'];
const STEP_INDEX: Record<WizardStep, number> = {
  classification: 0,
  'tech-specs': 1,
  location: 2,
  health: 3,
  inventory: 4,
  label: 5,
  success: 6,
};

interface ValidationDraft {
  name: string;
  sector: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  locationDetails: string;
  criticality: AssetCriticality;
  healthScore: number;
  assetNumber: string;
}

export function AssetValidationWizard({ asset, onExit }: AssetValidationWizardProps) {
  const { setores, tipos, fabricantes, modelos, validatedAssets, setValidatedAssets, setProvisionalAssets, isDesktopMode } =
    useAppContext();

  const [step, setStep] = useState<WizardStep>('classification');
  const [draft, setDraft] = useState<ValidationDraft>({
    name: asset.name,
    sector: asset.sector,
    type: asset.type ?? '',
    manufacturer: asset.manufacturer ?? '',
    model: asset.model ?? '',
    serialNumber: asset.serialNumber ?? '',
    locationDetails: asset.locationDetails ?? '',
    criticality: asset.criticality ?? 'Média',
    healthScore: asset.healthScore ?? 100,
    assetNumber: asset.noTag ? '' : asset.assetNumber || generateAssetTag(validatedAssets),
  });

  const handleConfirm = () => {
    const finalAsset: Asset = {
      ...asset,
      name: draft.name,
      sector: draft.sector,
      type: draft.type,
      manufacturer: draft.manufacturer || undefined,
      model: draft.model || undefined,
      serialNumber: draft.serialNumber || undefined,
      locationDetails: draft.locationDetails || undefined,
      criticality: draft.criticality,
      healthScore: draft.healthScore,
      assetNumber: draft.assetNumber,
      status: 'active',
      date: new Date().toISOString().slice(0, 10),
      osCount: asset.osCount ?? 0,
      noTag: false,
    };

    setValidatedAssets((prev) => [...prev, finalAsset]);
    setProvisionalAssets((prev) => prev.filter((a) => a.id !== asset.id));
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
            aria-label="Cancelar e voltar"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            {step === 'success' ? <ArrowLeft className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
          <h1 className="text-base font-semibold text-zinc-100">Validação de Ativo</h1>
          <div className="w-9" />
        </header>

        {step !== 'success' && <StepIndicator steps={STEP_LABELS} currentIndex={STEP_INDEX[step]} />}

        {step === 'classification' && (
          <ClassificationStep
            initialValue={{ name: draft.name, sector: draft.sector, type: draft.type }}
            setores={setores}
            tipos={tipos}
            onNext={(value) => {
              setDraft((prev) => ({ ...prev, ...value }));
              setStep('tech-specs');
            }}
          />
        )}

        {step === 'tech-specs' && (
          <TechSpecsStep
            initialValue={{
              manufacturer: draft.manufacturer,
              model: draft.model,
              serialNumber: draft.serialNumber,
            }}
            fabricantes={fabricantes}
            modelos={modelos}
            onBack={() => setStep('classification')}
            onNext={(value) => {
              setDraft((prev) => ({ ...prev, ...value }));
              setStep('location');
            }}
          />
        )}

        {step === 'location' && (
          <LocationCriticalityStep
            initialValue={{ locationDetails: draft.locationDetails, criticality: draft.criticality }}
            onBack={() => setStep('tech-specs')}
            onNext={(value) => {
              setDraft((prev) => ({ ...prev, ...value }));
              setStep('health');
            }}
          />
        )}

        {step === 'health' && (
          <HealthScoreStep
            initialValue={{ healthScore: draft.healthScore }}
            onBack={() => setStep('location')}
            onNext={(value) => {
              setDraft((prev) => ({ ...prev, ...value }));
              setStep('inventory');
            }}
          />
        )}

        {step === 'inventory' && (
          <InventoryTagStep
            initialValue={{ assetNumber: draft.assetNumber }}
            wasNoTag={asset.noTag ?? false}
            existingAssets={validatedAssets}
            onBack={() => setStep('health')}
            onNext={(value) => {
              setDraft((prev) => ({ ...prev, ...value }));
              setStep('label');
            }}
          />
        )}

        {step === 'label' && (
          <QrLabelStep
            value={{ name: draft.name, assetNumber: draft.assetNumber, sector: draft.sector }}
            onBack={() => setStep('inventory')}
            onConfirm={handleConfirm}
          />
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Ativo validado com sucesso!</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {draft.name} · {draft.assetNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={onExit}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
            >
              Voltar à Gestão de Ativos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
