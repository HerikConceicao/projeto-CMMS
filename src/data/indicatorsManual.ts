export interface IndicatorEntry {
  name: string;
  formula: string;
  concept: string;
  meaning: string;
}

export const INDICATORS_MANUAL: IndicatorEntry[] = [
  {
    name: 'MTBF (Mean Time Between Failures)',
    formula: 'Uptime / Número de Paradas',
    concept:
      'Tempo médio de operação contínua entre uma falha e outra do mesmo conjunto de ativos.',
    meaning:
      'Quanto maior o MTBF, mais confiável é o parque de ativos. Quedas no indicador sinalizam degradação ou falta de manutenção preventiva.',
  },
  {
    name: 'Disponibilidade (Availability)',
    formula: '(Uptime / Tempo Total) × 100',
    concept: 'Percentual do tempo em que os ativos estiveram disponíveis para produção.',
    meaning:
      'Indicador direto de capacidade produtiva. Quedas de disponibilidade custam produção perdida e devem ser investigadas por setor ou ativo.',
  },
  {
    name: 'MTTR (Mean Time To Repair)',
    formula: 'Downtime / Número de Intervenções',
    concept: 'Tempo médio necessário para reparar uma falha, do diagnóstico à liberação da máquina.',
    meaning:
      'Mede a eficiência da equipe de manutenção. MTTR alto pode indicar falta de peças, procedimentos ou capacitação técnica.',
  },
  {
    name: 'Aderência Preventiva',
    formula: '(Preventivas Realizadas / Preventivas Planejadas) × 100',
    concept: 'Percentual do plano de manutenção preventiva efetivamente executado.',
    meaning:
      'Baixa aderência preventiva antecipa aumento de corretivas e quebras não planejadas nos meses seguintes.',
  },
  {
    name: 'Uptime Total',
    formula: 'Tempo Total do Período − Downtime',
    concept: 'Soma das horas em que os ativos estiveram operacionais no período analisado.',
    meaning: 'Base para o cálculo de disponibilidade e para dimensionar a capacidade produtiva real.',
  },
  {
    name: 'Downtime Total',
    formula: 'Soma da duração de todas as paradas no período',
    concept: 'Total de horas em que os ativos ficaram parados por manutenção, corretiva ou preventiva.',
    meaning:
      'Cada hora de downtime representa custo de oportunidade: produção não realizada, prazos e contratos em risco.',
  },
];
