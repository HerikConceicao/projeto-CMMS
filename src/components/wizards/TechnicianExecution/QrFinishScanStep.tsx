import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, ScanLine, Tag } from 'lucide-react';

interface QrFinishScanStepProps {
  assetName: string;
  expectedAssetNumber: string;
  onConfirm: () => void;
}

export function QrFinishScanStep({
  assetName,
  expectedAssetNumber,
  onConfirm,
}: QrFinishScanStepProps) {
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

  const handleManualCodeSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (manualCode.trim().toLowerCase() !== expectedAssetNumber.trim().toLowerCase()) {
      setCodeError('TAG não confere com o equipamento desta OS.');
      return;
    }
    onConfirm();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
        <ScanLine className="h-5 w-5 shrink-0 text-orange-500" />
        <p className="text-sm text-zinc-300">
          Escaneie o QR Code de <span className="font-medium">{assetName}</span> para confirmar
          presencialmente a conclusão do serviço.
        </p>
      </div>

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
        onClick={onConfirm}
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
            placeholder={expectedAssetNumber}
            className="h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Confirmar
        </button>
      </form>
      {codeError && <p className="text-sm text-red-500">{codeError}</p>}
    </div>
  );
}
