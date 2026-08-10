import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PhotoCapture } from '../components/ui/PhotoCapture';
import type { Asset } from '../types';

interface ReportAssetScreenProps {
  onExit: () => void;
}

function nextAssetId(a: Asset[], b: Asset[]): number {
  const ids = [...a, ...b].map((asset) => asset.id);
  return (ids.length > 0 ? Math.max(...ids) : 0) + 1;
}

export function ReportAssetScreen({ onExit }: ReportAssetScreenProps) {
  const { setores, validatedAssets, provisionalAssets, setProvisionalAssets, currentUser, isDesktopMode } =
    useAppContext();

  const [photos, setPhotos] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [sector, setSector] = useState(setores[0]?.name ?? '');
  const [assetNumber, setAssetNumber] = useState('');
  const [noTag, setNoTag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setPhotos([]);
    setName('');
    setAssetNumber('');
    setNoTag(false);
    setError(null);
    setSubmitted(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Informe o nome do ativo.');
      return;
    }
    if (!sector) {
      setError('Selecione o setor onde o ativo está localizado.');
      return;
    }
    if (!noTag && !assetNumber.trim()) {
      setError('Informe o número de inventário ou marque "Não possui placa".');
      return;
    }

    const newAsset: Asset = {
      id: nextAssetId(validatedAssets, provisionalAssets),
      name: name.trim(),
      sector,
      assetNumber: noTag ? '' : assetNumber.trim(),
      reportedBy: currentUser?.name,
      status: 'pending',
      date: new Date().toISOString().slice(0, 10),
      noTag,
      photos: photos.length > 0 ? photos : undefined,
    };

    setProvisionalAssets((prev) => [...prev, newAsset]);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-6 p-4 sm:p-6 ${isDesktopMode ? 'max-w-2xl' : 'max-w-xl'}`}
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
          <h1 className="text-base font-semibold text-zinc-100">Reportar Ativo</h1>
        </header>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Cadastro enviado!</h2>
              <p className="mt-1 text-sm text-zinc-500">
                O ativo foi enviado para a fila de validação do gestor.
              </p>
            </div>
            <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                className="flex h-11 flex-1 items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Reportar outro ativo
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
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-zinc-500">
              Registre uma máquina que ainda não está cadastrada no sistema. O gestor validará as
              informações antes de liberar o ativo para abertura de ordens de serviço.
            </p>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-300">
                Fotos da máquina e da placa de identificação
              </p>
              <PhotoCapture photos={photos} onChange={setPhotos} />
            </div>

            <div>
              <label htmlFor="report-name" className="mb-2 block text-sm font-medium text-zinc-300">
                Nome do ativo
              </label>
              <input
                id="report-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex: Motor reserva Linha 2"
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label htmlFor="report-sector" className="mb-2 block text-sm font-medium text-zinc-300">
                Setor
              </label>
              {setores.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nenhum setor cadastrado. Cadastre em Pré-cadastro do sistema.
                </p>
              ) : (
                <select
                  id="report-sector"
                  value={sector}
                  onChange={(e) => {
                    setSector(e.target.value);
                    if (error) setError(null);
                  }}
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
              <label htmlFor="report-tag" className="mb-2 block text-sm font-medium text-zinc-300">
                Número de inventário (se houver)
              </label>
              <input
                id="report-tag"
                type="text"
                value={assetNumber}
                onChange={(e) => {
                  setAssetNumber(e.target.value);
                  if (error) setError(null);
                }}
                disabled={noTag}
                placeholder="Ex: PAT-0892"
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
              />
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <input
                type="checkbox"
                checked={noTag}
                onChange={(e) => {
                  setNoTag(e.target.checked);
                  if (error) setError(null);
                }}
                className="h-4 w-4 shrink-0 accent-orange-500"
              />
              <span className="text-sm text-zinc-300">Não possui placa de inventário</span>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
            >
              Enviar para validação
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
