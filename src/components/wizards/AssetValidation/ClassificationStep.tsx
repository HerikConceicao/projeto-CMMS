import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Setor, TipoEquipamento } from '../../../types';

export interface ClassificationValue {
  name: string;
  sector: string;
  type: string;
}

interface ClassificationStepProps {
  initialValue: ClassificationValue;
  setores: Setor[];
  tipos: TipoEquipamento[];
  onNext: (value: ClassificationValue) => void;
}

export function ClassificationStep({ initialValue, setores, tipos, onNext }: ClassificationStepProps) {
  const [name, setName] = useState(initialValue.name);
  const [sector, setSector] = useState(initialValue.sector || setores[0]?.name || '');
  const [type, setType] = useState(initialValue.type || tipos[0]?.name || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !sector || !type) {
      setError('Preencha nome, setor e tipo de equipamento.');
      return;
    }
    onNext({ name: name.trim(), sector, type });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Classificação</h2>
        <p className="text-sm text-zinc-500">Identifique o ativo e onde ele está instalado.</p>
      </div>

      <div>
        <label htmlFor="asset-name" className="mb-2 block text-sm font-medium text-zinc-300">
          Nome do ativo
        </label>
        <input
          id="asset-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Compressor de Ar 03"
          className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div>
        <label htmlFor="asset-sector" className="mb-2 block text-sm font-medium text-zinc-300">
          Setor
        </label>
        {setores.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum setor cadastrado. Cadastre em Pré-cadastro do sistema.
          </p>
        ) : (
          <select
            id="asset-sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            {setores.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="asset-type" className="mb-2 block text-sm font-medium text-zinc-300">
          Tipo de equipamento
        </label>
        {tipos.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum tipo cadastrado. Cadastre em Pré-cadastro do sistema.
          </p>
        ) : (
          <select
            id="asset-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            {tipos.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
      >
        Continuar
      </button>
    </form>
  );
}
