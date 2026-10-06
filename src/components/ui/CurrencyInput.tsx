import type { FocusEventHandler } from 'react';

interface CurrencyInputProps {
  /** Valor numérico como string com ponto decimal ("1500.5"), ou "" quando vazio. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
  id?: string;
  /** Máximo de dígitos (centavos incluídos). 10 cabe em numeric(10,2) e numeric(12,2). */
  maxDigits?: number;
}

function formatMasked(value: string): string {
  if (value === '') return '';
  const number = Number(value);
  if (Number.isNaN(number)) return '';
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Campo de moeda no estilo "caixa eletrônico": a pessoa digita só números e os
 * centavos entram sozinhos (digitar 1 → 0,01; 15000 → 150,00; 1500000 → 15.000,00),
 * com ponto de milhar e vírgula automáticos. O valor repassado ao pai continua
 * sendo um número em string ("15000.00"), compatível com Number(...).
 */
export function CurrencyInput({
  value,
  onChange,
  onBlur,
  placeholder = '0,00',
  className,
  id,
  maxDigits = 10,
}: CurrencyInputProps) {
  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
    if (digits === '') {
      onChange('');
      return;
    }
    onChange((parseInt(digits, 10) / 100).toFixed(2));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatMasked(value)}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}
