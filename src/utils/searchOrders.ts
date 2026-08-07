import type { OrderOfService } from '../types';

export function matchesOSSearch(os: OrderOfService, term: string): boolean {
  if (!term.trim()) return true;
  const needle = term.trim().toLowerCase();
  return (
    String(os.id).includes(needle) ||
    os.assetName.toLowerCase().includes(needle) ||
    os.sector.toLowerCase().includes(needle) ||
    os.assetNumber.toLowerCase().includes(needle)
  );
}
