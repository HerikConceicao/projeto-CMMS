const PHONE_FORMAT_REGEX = /^\(\d{2}\) \d{5}-\d{4}$/;

/** Aplica a máscara brasileira (XX) XXXXX-XXXX enquanto o usuário digita. */
export function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Verifica se o telefone está no formato completo (XX) XXXXX-XXXX. */
export function isValidPhoneBR(value: string): boolean {
  return PHONE_FORMAT_REGEX.test(value);
}
