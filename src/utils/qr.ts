// QR Code das etiquetas: guarda o endereço do app com a TAG do ativo, para que a
// câmera do celular abra o app direto na abertura de OS desse ativo.
// A base é fixa (não usa window.location) para que etiquetas impressas em
// localhost ou em um preview não apontem para um endereço que vai deixar de existir.

const DEFAULT_PUBLIC_APP_URL = 'https://projeto-cmms.pages.dev';
const ASSET_PARAM = 'ativo';

function publicAppUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  return (fromEnv?.trim() || DEFAULT_PUBLIC_APP_URL).replace(/\/+$/, '');
}

/** Valor gravado no QR Code da etiqueta de um ativo. */
export function assetQrValue(assetNumber: string): string {
  return `${publicAppUrl()}/?${ASSET_PARAM}=${encodeURIComponent(assetNumber.trim())}`;
}

/**
 * Extrai a TAG do ativo de um texto lido de um QR Code. Aceita o formato novo
 * (endereço com ?ativo=TAG) e o antigo (apenas a TAG), para não invalidar etiquetas
 * já impressas.
 */
export function parseAssetTagFromQr(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.searchParams.get(ASSET_PARAM)?.trim() || null;
  } catch {
    return trimmed;
  }
}

/** TAG do ativo presente no endereço aberto no navegador (?ativo=TAG), se houver. */
export function readAssetTagFromLocation(): string | null {
  const tag = new URLSearchParams(window.location.search).get(ASSET_PARAM)?.trim();
  return tag || null;
}

/** Remove o parâmetro ?ativo= do endereço, sem recarregar a página. */
export function clearAssetTagFromLocation(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(ASSET_PARAM)) return;
  url.searchParams.delete(ASSET_PARAM);
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}
