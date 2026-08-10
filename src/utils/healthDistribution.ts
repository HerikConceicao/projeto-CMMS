import type { Asset } from '../types';
import { healthScoreLabel } from './badges';

export interface HealthDistributionBucket {
  key: 'Saudável' | 'Alerta' | 'Crítico';
  count: number;
}

export function buildHealthDistribution(assets: Asset[]): HealthDistributionBucket[] {
  const buckets: Record<HealthDistributionBucket['key'], number> = {
    Saudável: 0,
    Alerta: 0,
    Crítico: 0,
  };

  assets.forEach((asset) => {
    if (asset.healthScore === undefined) return;
    buckets[healthScoreLabel(asset.healthScore) as HealthDistributionBucket['key']] += 1;
  });

  return (['Saudável', 'Alerta', 'Crítico'] as const).map((key) => ({ key, count: buckets[key] }));
}
