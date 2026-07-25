import {
  calculateBiometricsOperationalEstimate,
  DEFAULT_CONSUMPTION_REFERENCE,
  getConsumptionPctForWeight,
  type BiometricsOperationalEstimate,
  type ConsumptionReferenceRow,
} from '../lib/biometricsReference';

export type BiometriaKpisInput = {
  pesoMedioG?: number | null;
  survivalPct?: number | null;
  biomassaAtualKg?: number | null;
  racaoConsumidaKg?: number | null;
  fca?: number | null;
  /** Productivity in kg/ha/dia, when the pond area and cycle age are known. */
  kgPerHaPerDay?: number | null;
};

export type BiometriaCard = {
  label: string;
  value: string;
  unit?: string;
  tone: 'blue' | 'green' | 'amber' | 'slate' | 'red';
};

export type BiometriaQuickAction = {
  label: string;
  description: string;
  to?: string;
  kind: 'primary' | 'secondary' | 'ghost';
  action: 'focus-form' | 'focus-chart' | 'navigate-despesca' | 'navigate-tanques';
};

export type BiometriaSnapshotInput = {
  cycleLabel?: string | null;
  totalReadings?: number | null;
  latestReadingAt?: string | null;
  latestWeightG?: number | null;
  survivalPct?: number | null;
};

export type BiometriaSnapshot = {
  label: string;
  value: string;
  detail?: string;
};

export const BIOMETRIA_CONSUMPTION_REFERENCE = DEFAULT_CONSUMPTION_REFERENCE;

export type { BiometricsOperationalEstimate, ConsumptionReferenceRow };

export function buildBiometriaPath(cycleId?: string | null, focus?: 'form' | 'chart') {
  const params = new URLSearchParams();
  if (cycleId) params.set('cycleId', cycleId);
  if (focus) params.set('focus', focus);
  const query = params.toString();
  return query ? `/biometrias?${query}` : '/biometrias';
}

function fmt(value: number | null | undefined, digits = 1) {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function buildBiometriaCards(kpis: BiometriaKpisInput): BiometriaCard[] {
  return [
    { label: 'Peso médio', value: fmt(kpis.pesoMedioG, 2), unit: 'g', tone: 'blue' },
    { label: 'Sobrevivência', value: fmt(kpis.survivalPct, 1), unit: '%', tone: 'green' },
    { label: 'Biomassa atual', value: fmt(kpis.biomassaAtualKg, 2), unit: 'kg', tone: 'amber' },
    { label: 'Ração consumida', value: fmt(kpis.racaoConsumidaKg, 2), unit: 'kg', tone: 'slate' },
    { label: 'FCA', value: fmt(kpis.fca, 3), tone: (kpis.fca ?? 0) > 1.8 ? 'red' : 'green' },
    { label: 'Produtividade', value: fmt(kpis.kgPerHaPerDay, 1), unit: 'kg/ha/dia', tone: 'blue' },
  ];
}

export function buildBiometriaQuickActions(): BiometriaQuickAction[] {
  return [
    { label: 'Nova leitura', description: 'Ir para o formulário e registrar um novo ponto.', kind: 'primary', action: 'focus-form' },
    { label: 'Ver curva', description: 'Abrir o gráfico e comparar a evolução.', kind: 'secondary', action: 'focus-chart' },
    { label: 'Ir para Despesca', description: 'Cruzar crescimento com a janela de saída.', to: '/despesca', kind: 'ghost', action: 'navigate-despesca' },
    { label: 'Voltar para Tanques', description: 'Revisar os viveiros e o contexto do ciclo.', to: '/tanques', kind: 'ghost', action: 'navigate-tanques' },
  ];
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const dateOnly = value.slice(0, 10);
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('pt-BR');
}

export function buildBiometriaSnapshot(input: BiometriaSnapshotInput): BiometriaSnapshot[] {
  return [
    { label: 'Ciclo', value: input.cycleLabel ?? '—', detail: 'referência ativa' },
    { label: 'Leituras', value: input.totalReadings == null ? '—' : String(input.totalReadings), detail: 'histórico salvo' },
    { label: 'Última leitura', value: formatDate(input.latestReadingAt), detail: 'data da biometria mais recente' },
    { label: 'Peso recente', value: input.latestWeightG == null ? '—' : `${fmt(input.latestWeightG, 2)} g`, detail: 'último ponto coletado' },
    { label: 'Sobrevivência', value: input.survivalPct == null ? '—' : `${fmt(input.survivalPct, 1)} %`, detail: 'índice do ciclo' },
  ];
}

export { calculateBiometricsOperationalEstimate, getConsumptionPctForWeight };
