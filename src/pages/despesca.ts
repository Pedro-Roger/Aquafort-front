export type DespescaProjectionInput = {
  optimalWeekStart?: number;
  optimalWeekEnd?: number;
  idealDate?: string | null;
  idealWeightG?: number | null;
  minCostPerKg?: number | null;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  assumptions?: {
    biometricPoints?: number;
    growthRateGPerDay?: number | null;
    survivalPct?: number | null;
    currentCost?: number | null;
    weeklyCost?: number | null;
  };
};

export type DespescaCard = {
  label: string;
  value: string;
  unit?: string;
  tone: 'blue' | 'green' | 'amber' | 'slate';
};

export type DespescaQuickAction = {
  label: string;
  description: string;
  to?: string;
  kind: 'primary' | 'secondary' | 'ghost';
  action: 'recompute' | 'navigate-biometrias' | 'navigate-tanques' | 'focus-chart';
};

export type DespescaSnapshotInput = {
  cycleLabel?: string | null;
  optimalWindow?: string | null;
  minCostPerKg?: number | null;
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  biometricPoints?: number | null;
};

export type DespescaSnapshot = {
  label: string;
  value: string;
  detail?: string;
};

export function buildDespescaPath(cycleId?: string | null, focus?: 'chart') {
  const params = new URLSearchParams();
  if (cycleId) params.set('cycleId', cycleId);
  if (focus) params.set('focus', focus);
  const query = params.toString();
  return query ? `/despesca?${query}` : '/despesca';
}

function fmt(value: number | null | undefined, digits = 1) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const dateOnly = value.slice(0, 10);
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('pt-BR');
}

function formatMoney(value?: number | null) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function confidenceLabel(confidence?: string | null) {
  if (confidence === 'HIGH') return 'Alta';
  if (confidence === 'MEDIUM') return 'Média';
  if (confidence === 'LOW') return 'Baixa';
  return '—';
}

export function buildDespescaCards(projection: DespescaProjectionInput): DespescaCard[] {
  return [
    {
      label: 'Janela',
      value: projection.optimalWeekStart != null && projection.optimalWeekEnd != null
        ? `S${projection.optimalWeekStart}-S${projection.optimalWeekEnd}`
        : '—',
      tone: 'blue',
    },
    { label: 'Data ideal', value: formatDate(projection.idealDate), tone: 'green' },
    { label: 'Peso ideal', value: fmt(projection.idealWeightG, 1), unit: 'g', tone: 'amber' },
    { label: 'Confiança', value: confidenceLabel(projection.confidence), tone: 'slate' },
    { label: 'Custo mínimo', value: formatMoney(projection.minCostPerKg), tone: 'blue' },
    { label: 'Biometrias', value: String(projection.assumptions?.biometricPoints ?? '—'), tone: 'green' },
  ];
}

export function buildDespescaQuickActions(): DespescaQuickAction[] {
  return [
    { label: 'Recalcular projeção', description: 'Atualizar a janela com a leitura mais recente.', kind: 'primary', action: 'recompute' },
    { label: 'Abrir Biometrias', description: 'Conferir o crescimento que alimenta a projeção.', to: '/biometrias', kind: 'secondary', action: 'navigate-biometrias' },
    { label: 'Ir para Viveiros', description: 'Revisar os viveiros que serão colhidos.', to: '/tanques', kind: 'ghost', action: 'navigate-tanques' },
    { label: 'Ver janela ideal', description: 'Destacar o trecho mais favorável do gráfico.', kind: 'ghost', action: 'focus-chart' },
  ];
}

export function buildDespescaSnapshot(input: DespescaSnapshotInput): DespescaSnapshot[] {
  return [
    { label: 'Ciclo', value: input.cycleLabel ?? '—', detail: 'origem da projeção' },
    { label: 'Janela ideal', value: input.optimalWindow ?? '—', detail: 'semanas indicadas para colher' },
    { label: 'Custo mínimo', value: input.minCostPerKg == null ? '—' : input.minCostPerKg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), detail: 'ponto mais eficiente' },
    { label: 'Confiança', value: input.confidence === 'HIGH' ? 'Alta' : input.confidence === 'MEDIUM' ? 'Média' : input.confidence === 'LOW' ? 'Baixa' : '—', detail: 'força da previsão' },
    { label: 'Biometrias', value: input.biometricPoints == null ? '—' : String(input.biometricPoints), detail: 'amostras usadas no cálculo' },
  ];
}
