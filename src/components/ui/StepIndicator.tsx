import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentIndex: number;
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={label} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'border-green-500 bg-green-500 text-zinc-950'
                    : isCurrent
                      ? 'border-orange-500 bg-orange-500 text-zinc-950'
                      : 'border-zinc-700 text-zinc-500'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`hidden text-center text-xs sm:block ${
                  isCurrent ? 'text-zinc-200' : 'text-zinc-500'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-2 h-px flex-1 transition-colors ${
                  isCompleted ? 'bg-green-500' : 'bg-zinc-800'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
