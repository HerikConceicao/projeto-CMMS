import type { Asset } from '../types';

export function matchesAssetSearch(asset: Asset, term: string): boolean {
  if (!term.trim()) return true;
  const needle = term.trim().toLowerCase();
  return (
    asset.name.toLowerCase().includes(needle) ||
    asset.assetNumber.toLowerCase().includes(needle) ||
    asset.sector.toLowerCase().includes(needle) ||
    (asset.type?.toLowerCase().includes(needle) ?? false)
  );
}
