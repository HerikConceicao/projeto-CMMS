import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Fabricante, Modelo } from '../../../types';

export interface TechSpecsValue {
  manufacturer: string;
  model: string;
  serialNumber: string;
}

interface TechSpecsStepProps {
  initialValue: TechSpecsValue;
  fabricantes: Fabricante[];
  modelos: Modelo[];
  onBack: () => void;
  onNext: (value: TechSpecsValue) => void;
}

export function TechSpecsStep({ initialValue, fabricantes, modelos, onBack, onNext }: TechSpecsStepProps) {
  const [manufacturer, setManufacturer] = useState(initialValue.manufacturer);
  const [model, setModel] = useState(initialValue.model);
  const [serialNumber, setSerialNumber] = useState(initialValue.serialNumber);

  const selectedFabricante = fabricantes.find((f) => f.name === manufacturer);
  const availableModelos = selectedFabricante
    ? modelos.filter((m) => m.manufacturerId === selectedFabricante.id)
    : [];

  const handleManufacturerChange = (value: string) => {
    setManufacturer(value);
    setModel('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Especificações Técnicas</h2>
        <p className="text-sm text-zinc-500">Opcional, mas recomendado para rastreabilidade.</p>
      </div>

      <div>
        <label htmlFor="asset-manufacturer" className="mb-2 block text-sm font-medium text-zinc-300">
          Fabricante
        </label>
        <select
          id="asset-manufacturer"
          value={manufacturer}
          onChange={(e) => handleManufacturerChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Não informado</option>
          {fabricantes.map((f) => (
            <option key={f.id} value={f.name}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="asset-model" className="mb-2 block text-sm font-medium text-zinc-300">
          Modelo
        </label>
        <select
          id="asset-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!selectedFabricante}
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
        >
          <option value="">Não informado</option>
          {availableModelos.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="asset-serial" className="mb-2 block text-sm font-medium text-zinc-300">
          Número de série
        </label>
        <input
          id="asset-serial"
          type="text"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          placeholder="Ex: SN-88451"
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={() => onNext({ manufacturer, model, serialNumber: serialNumber.trim() })}
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
