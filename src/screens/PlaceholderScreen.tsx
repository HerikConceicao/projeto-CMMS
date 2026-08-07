import { ArrowLeft, Construction } from 'lucide-react';

interface PlaceholderScreenProps {
  title: string;
  onBack: () => void;
}

export function PlaceholderScreen({ title, onBack }: PlaceholderScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-6 text-center">
      <Construction className="h-10 w-10 text-orange-500" />
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">Esta tela ainda será implementada.</p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao início
      </button>
    </div>
  );
}
