import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { fileToCompressedDataUrl } from '../../utils/image';

interface PhotoCaptureProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export function PhotoCapture({ photos, onChange }: PhotoCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const compressed = await Promise.all(files.map((file) => fileToCompressedDataUrl(file)));
      onChange([...photos, ...compressed]);
      setError(null);
    } catch {
      setError('Não foi possível processar uma das fotos. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
            <img src={photo} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              aria-label="Remover foto"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-700 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-60"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          <span className="text-[10px]">Adicionar</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
