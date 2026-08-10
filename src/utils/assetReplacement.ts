import type { Asset, OrderOfService } from '../types';

export interface AssetReplacementRow {
  asset: Asset;
  accumulatedCost: number;
  ratioPct: number | null;
}

export type ReplacementRecommendation = 'substituir' | 'avaliar' | 'controlado';

export function replacementRecommendation(ratioPct: number | null): ReplacementRecommendation {
  if (ratioPct === null) return 'controlado';
  if (ratioPct >= 60) return 'substituir';
  if (ratioPct >= 30) return 'avaliar';
  return 'controlado';
}

/** Ordena os ativos pelo custo acumulado de manutenção em relação ao valor residual. */
export function buildReplacementRanking(
  assets: Asset[],
  orders: OrderOfService[],
): AssetReplacementRow[] {
  const costByAsset = new Map<number, number>();
  orders.forEach((os) => {
    if (os.laborCost === undefined && os.partsCost === undefined) return;
    const cost = (os.laborCost ?? 0) + (os.partsCost ?? 0);
    costByAsset.set(os.assetId, (costByAsset.get(os.assetId) ?? 0) + cost);
  });

  return assets
    .map((asset) => {
      const accumulatedCost = costByAsset.get(asset.id) ?? 0;
      const ratioPct =
        asset.residualValue && asset.residualValue > 0
          ? (accumulatedCost / asset.residualValue) * 100
          : null;
      return { asset, accumulatedCost, ratioPct };
    })
    .sort((a, b) => {
      if (a.ratioPct !== null && b.ratioPct !== null) return b.ratioPct - a.ratioPct;
      if (a.ratioPct !== null) return -1;
      if (b.ratioPct !== null) return 1;
      return b.accumulatedCost - a.accumulatedCost;
    });
}
