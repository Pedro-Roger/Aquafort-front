import {
  calculateBiometricsOperationalEstimate,
  DEFAULT_CONSUMPTION_REFERENCE,
  getConsumptionPctForWeight,
  type BiometricsOperationalEstimate,
  type ConsumptionReferenceRow,
} from '../lib/biometricsReference';
import { averageWeightGToPlPerGram, isBercarioPondType, plPerGramToAverageWeightG } from '../lib/plPerGram';
import type { PondType } from '../types';

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

/** Shape shared by the sidebar form and the modal form once their string inputs are parsed. */
export type BiometricFormValues = {
  measuredAt: string;
  sampleCount: number;
  averageWeightG: number;
  survivalRatePct?: number;
  estimatedBiomass?: number;
};

export type BiometricPayload = {
  cycleId: string;
  measuredAt: string;
  sampleCount: number;
  averageWeightG: number;
  survivalRatePct?: number;
  estimatedBiomass?: number;
  responsibleId?: string;
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
    { label: 'Voltar para Viveiros', description: 'Revisar os viveiros e o contexto do ciclo.', to: '/tanques', kind: 'ghost', action: 'navigate-tanques' },
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

/** Same "has enough data to save" rule the sidebar form and the modal form both apply. */
export function isBiometricFormValid(values: Pick<BiometricFormValues, 'measuredAt' | 'sampleCount' | 'averageWeightG'>): boolean {
  return Boolean(values.measuredAt && values.sampleCount && values.averageWeightG);
}

export function buildBiometricPayload(
  cycleId: string,
  values: BiometricFormValues,
  responsibleId?: string,
): BiometricPayload {
  return {
    cycleId,
    measuredAt: values.measuredAt,
    sampleCount: values.sampleCount,
    averageWeightG: values.averageWeightG,
    survivalRatePct: values.survivalRatePct,
    estimatedBiomass: values.estimatedBiomass,
    responsibleId,
  };
}

export { calculateBiometricsOperationalEstimate, getConsumptionPctForWeight };
export { averageWeightGToPlPerGram, isBercarioPondType, plPerGramToAverageWeightG };

/**
 * RF-10/RF-11: the sidebar and modal biometry forms both share this one rule —
 * bercario cycles read their weight input as PL/g and the DTO always ends up
 * with `averageWeightG` (RN-09 conversion); every other pond type is a no-op.
 */
export function resolveAverageWeightGInput(rawValue: number, pondType?: PondType | string | null): number {
  return isBercarioPondType(pondType) ? plPerGramToAverageWeightG(rawValue) : rawValue;
}
