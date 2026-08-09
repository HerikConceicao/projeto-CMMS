import { useState } from 'react';
import { ArrowLeft, Camera, Search, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AssetDetailModal } from '../components/modals/AssetDetailModal';
import { AssetValidationWizard } from './AssetValidationWizard';
import {
  ASSET_STATUS_LABELS,
  assetStatusClasses,
  criticalityClasses,
  healthScoreBarClasses,
  healthScoreTextClasses,
} from '../utils/badges';
import { formatDate } from '../utils/date';
import { matchesAssetSearch } from '../utils/searchAssets';
import type { Asset } from '../types';

interface AssetManagementScreenProps {
  onExit: () => void;
}

type Tab = 'validated' | 'pending';

export function AssetManagementScreen({ onExit }: AssetManagementScreenProps) {
  const { validatedAssets, provisionalAssets, isDesktopMode } = useAppContext();

  const [tab, setTab] = useState<Tab>('validated');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  // Guarda o objeto do ativo (não só o id): o wizard remove o ativo de
  // provisionalAssets ao concluir, então derivar por id o perderia antes
  // da tela de sucesso ser exibida.
  const [validatingAsset, setValidatingAsset] = useState<Asset | null>(null);

  if (validatingAsset) {
    return <AssetValidationWizard asset={validatingAsset} onExit={() => setValidatingAsset(null)} />;
  }

  const filteredValidated = validatedAssets.filter((asset) => matchesAssetSearch(asset, searchTerm));
  const detailAsset = validatedAssets.find((a) => a.id === detailId) ?? null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div
        className={`mx-auto flex flex-col gap-5 p-4 sm:p-6 ${isDesktopMode ? 'max-w-5xl' : 'max-w-xl'}`}
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
          <h1 className="text-base font-semibold text-zinc-100">Gestão de Ativos</h1>
        </header>

        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setTab('validated')}
            className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
              tab === 'validated' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ativos Validados ({validatedAssets.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`h-10 flex-1 rounded-md text-sm font-medium transition-colors ${
              tab === 'pending' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Cadastros Pendentes ({provisionalAssets.length})
          </button>
        </div>

        {tab === 'validated' && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, TAG, setor ou tipo"
                className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {filteredValidated.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">Nenhum ativo encontrado.</p>
            ) : (
              <div className={`grid gap-3 ${isDesktopMode ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredValidated.map((asset) => {
                  const health = asset.healthScore ?? 0;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setDetailId(asset.id)}
                      className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:border-orange-500/50 hover:bg-zinc-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-100">{asset.name}</p>
                          <p className="text-xs text-zinc-500">
                            {asset.assetNumber} · {asset.sector}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${assetStatusClasses(asset.status)}`}
                        >
                          {ASSET_STATUS_LABELS[asset.status]}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {asset.criticality && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${criticalityClasses(asset.criticality)}`}
                          >
                            {asset.criticality}
                          </span>
                        )}
                        {asset.type && <span className="text-xs text-zinc-500">{asset.type}</span>}
                      </div>

                      {asset.healthScore !== undefined && (
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-zinc-500">Health Score</span>
                            <span className={`text-xs font-medium ${healthScoreTextClasses(health)}`}>
                              {health}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${healthScoreBarClasses(health)}`}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'pending' && (
          <div className="flex flex-col gap-3">
            {provisionalAssets.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                Nenhum cadastro pendente de validação.
              </p>
            ) : (
              provisionalAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{asset.name}</p>
                      <p className="text-xs text-zinc-500">{asset.sector}</p>
                    </div>
                    {asset.noTag && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                        <Camera className="h-3 w-3" />
                        Sem etiqueta
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    {asset.reportedBy && <span>Reportado por {asset.reportedBy}</span>}
                    <span>{formatDate(asset.date)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setValidatingAsset(asset)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-400"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Validar cadastro
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {detailAsset && <AssetDetailModal asset={detailAsset} onClose={() => setDetailId(null)} />}
    </div>
  );
}
