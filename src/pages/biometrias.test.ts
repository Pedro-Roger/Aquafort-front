import { describe, expect, it } from 'vitest';
import {
  BIOMETRIA_CONSUMPTION_REFERENCE,
  buildBiometriaCards,
  buildBiometriaPath,
  buildBiometriaQuickActions,
  buildBiometriaSnapshot,
  calculateBiometricsOperationalEstimate,
  getConsumptionPctForWeight,
} from './biometrias';

describe('buildBiometriaCards', () => {
  it('maps KPI values into operational cards', () => {
    const cards = buildBiometriaCards({
      pesoMedioG: 12.34,
      survivalPct: 78.9,
      biomassaAtualKg: 1234.56,
      racaoConsumidaKg: 89.01,
      fca: 1.67,
    });

    expect(cards[0]).toMatchObject({ label: 'Peso médio', value: '12,34', unit: 'g' });
    expect(cards[4]).toMatchObject({ label: 'FCA', value: '1,670', tone: 'green' });
  });

  it('builds quick actions for the biometrics page', () => {
    const actions = buildBiometriaQuickActions();

    expect(actions.map((action) => action.label)).toEqual([
      'Nova leitura',
      'Ver curva',
      'Ir para Despesca',
      'Voltar para Tanques',
    ]);
    expect(actions[2]).toMatchObject({ to: '/despesca', kind: 'ghost' });
  });

  it('builds a compact cycle snapshot', () => {
    const snapshot = buildBiometriaSnapshot({
      cycleLabel: 'V13 · Lote 2026-07',
      totalReadings: 5,
      latestReadingAt: '2026-07-09T00:00:00.000Z',
      latestWeightG: 18.42,
      survivalPct: 77.9,
    });

    expect(snapshot[0]).toMatchObject({ label: 'Ciclo', value: 'V13 · Lote 2026-07' });
    expect(snapshot[2]).toMatchObject({ label: 'Última leitura', value: '09/07/2026' });
  });

  it('builds a biometrics route with cycle context', () => {
    expect(buildBiometriaPath('cycle-123', 'form')).toBe('/biometrias?cycleId=cycle-123&focus=form');
  });

  it('maps weight to the reference consumption percentage table', () => {
    expect(BIOMETRIA_CONSUMPTION_REFERENCE.length).toBeGreaterThan(0);
    expect(getConsumptionPctForWeight(0.1)).toBe(15);
    expect(getConsumptionPctForWeight(1)).toBe(10);
    expect(getConsumptionPctForWeight(21)).toBe(2);
    // between two rows the lighter row still applies
    expect(getConsumptionPctForWeight(18.4)).toBe(2.6);
  });

  it('estimates biomass and survival from biometrics and feed consumption', () => {
    const estimate = calculateBiometricsOperationalEstimate({
      averageWeightG: 18,
      racaoConsumidaKg: 120,
      plCount: 80000,
    });

    expect(estimate.consumptionPct).toBe(2.6);
    expect(estimate.biomassKg).toBe(4615.38);
    expect(estimate.shrimpCount).toBe(256410.26);
    expect(estimate.survivalPct).toBe(320.51);
  });
});
