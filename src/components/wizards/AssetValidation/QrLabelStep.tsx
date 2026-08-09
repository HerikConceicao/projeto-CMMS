import { ArrowLeft, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export interface LabelPreviewValue {
  name: string;
  assetNumber: string;
  sector: string;
}

interface QrLabelStepProps {
  value: LabelPreviewValue;
  onBack: () => void;
  onConfirm: () => void;
}

export function QrLabelStep({ value, onBack, onConfirm }: QrLabelStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Etiqueta com QR Code</h2>
        <p className="text-sm text-zinc-500">
          Pronta para impressão em etiqueta térmica e fixação no ativo.
        </p>
      </div>

      <div className="flex justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="print-area flex w-48 flex-col items-center gap-2 rounded-lg border border-zinc-700 bg-white p-4 text-center">
          <QRCodeSVG value={value.assetNumber} size={128} level="M" />
          <p className="text-sm font-bold text-zinc-950">{value.assetNumber}</p>
          <p className="line-clamp-2 text-xs text-zinc-700">{value.name}</p>
          <p className="text-xs text-zinc-500">{value.sector}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
      >
        <Printer className="h-4 w-4" />
        Imprimir etiqueta
      </button>

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
          onClick={onConfirm}
          className="flex h-11 flex-1 items-center justify-center rounded-lg bg-green-500 text-sm font-medium text-zinc-950 transition-colors hover:bg-green-400"
        >
          Concluir validação
        </button>
      </div>
    </div>
  );
}
