import type { Asset } from '../types';

export function generateAssetTag(existingAssets: Asset[]): string {
  const numbers = existingAssets
    .map((asset) => {
      const match = asset.assetNumber.match(/(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((n) => !Number.isNaN(n));

  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `PAT-${String(next).padStart(4, '0')}`;
}

export function isAssetTagTaken(tag: string, existingAssets: Asset[], ignoreId?: number): boolean {
  const needle = tag.trim().toLowerCase();
  return existingAssets.some(
    (asset) => asset.id !== ignoreId && asset.assetNumber.trim().toLowerCase() === needle,
  );
}
