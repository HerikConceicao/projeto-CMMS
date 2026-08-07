import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, QrCode, ScanLine, Search, Tag } from 'lucide-react';
import type { Asset } from '../../../types';
import { criticalityClasses } from '../../../utils/badges';

interface AssetIdentificationStepProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
}

type IdentifyTab = 'search' | 'qr';

function AssetResultCard({ asset, onSelect }: { asset: Asset; onSelect: (asset: Asset) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(asset)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left transition-colors hover:border-orange-500/50 hover:bg-zinc-800"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-100">{asset.name}</p>
        <p className="text-xs text-zinc-500">
          {asset.assetNumber} · {asset.sector}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${criticalityClasses(asset.criticality)}`}
      >
        {asset.criticality ?? 'N/D'}
      </span>
    </button>
  );
}

function QrScanPanel({ assets, onSelect }: AssetIdentificationStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Câmera não disponível neste navegador.');
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        setCameraError('Não foi possível acessar a câmera. Use a leitura manual abaixo.');
      });

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleSimulateScan = () => {
    if (assets.length === 0) return;
    const random = assets[Math.floor(Math.random() * assets.length)];
    onSelect(random);
  };

  const handleManualCodeSubmit = (event: FormEvent) => {
    event.preventDefault();
    const asset = assets.find(
      (a) => a.assetNumber.trim().toLowerCase() === manualCode.trim().toLowerCase(),
    );
    if (!asset) {
      setCodeError('Nenhum ativo encontrado com essa TAG.');
      return;
    }
    onSelect(asset);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertCircle className="h-6 w-6 text-zinc-600" />
            <p className="text-sm text-zinc-500">{cameraError}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-2/3 w-2/3 rounded-2xl border-2 border-orange-500/70" />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleSimulateScan}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
      >
        <ScanLine className="h-4 w-4" />
        Simular leitura de QR Code
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-600">ou digite o código da etiqueta</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={handleManualCodeSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value);
              if (codeError) setCodeError(null);
            }}
            placeholder="PAT-0892"
            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Buscar
        </button>
      </form>
      {codeError && <p className="text-sm text-red-500">{codeError}</p>}
    </div>
  );
}

export function AssetIdentificationStep({ assets, onSelect }: AssetIdentificationStepProps) {
  const [tab, setTab] = useState<IdentifyTab>('search');
  const [searchTerm, setSearchTerm] = useState('');

  const results = assets.filter((asset) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      asset.name.toLowerCase().includes(term) || asset.assetNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="mb-4 flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => setTab('search')}
          className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'search' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="h-4 w-4" />
          Buscar TAG/Nome
        </button>
        <button
          type="button"
          onClick={() => setTab('qr')}
          className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'qr' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <QrCode className="h-4 w-4" />
          Escanear QR Code
        </button>
      </div>

      {tab === 'search' ? (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome do equipamento ou TAG (ex: PAT-0892)"
              className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">Nenhum ativo encontrado.</p>
            ) : (
              results.map((asset) => (
                <AssetResultCard key={asset.id} asset={asset} onSelect={onSelect} />
              ))
            )}
          </div>
        </div>
      ) : (
        <QrScanPanel assets={assets} onSelect={onSelect} />
      )}
    </div>
  );
}
