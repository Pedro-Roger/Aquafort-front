import { describe, expect, it } from 'vitest';
import { buildDespescaCards, buildDespescaPath, buildDespescaQuickActions, buildDespescaSnapshot } from './despesca';

describe('buildDespescaCards', () => {
  it('builds the main harvest summary cards', () => {
    const cards = buildDespescaCards({
      optimalWeekStart: 12,
      optimalWeekEnd: 14,
      idealDate: '2026-07-20T00:00:00.000Z',
      idealWeightG: 23.4,
      minCostPerKg: 15.9,
      confidence: 'HIGH',
      assumptions: { biometricPoints: 4 },
    });

    expect(cards[0]).toMatchObject({ label: 'Janela', value: 'S12-S14' });
    expect(cards[1]).toMatchObject({ label: 'Data ideal', value: '20/07/2026' });
    expect(cards[3]).toMatchObject({ label: 'Confiança', value: 'Alta' });
  });

  it('builds quick actions for the despesca page', () => {
    const actions = buildDespescaQuickActions();

    expect(actions.map((action) => action.label)).toEqual([
      'Recalcular projeção',
      'Abrir Biometrias',
      'Ir para Tanques',
      'Ver janela ideal',
    ]);
    expect(actions[1]).toMatchObject({ to: '/biometrias', kind: 'secondary' });
  });

  it('builds a compact harvest snapshot', () => {
    const snapshot = buildDespescaSnapshot({
      cycleLabel: 'V13 · Lote 2026-07',
      optimalWindow: 'S12-S14',
      minCostPerKg: 15.9,
      confidence: 'HIGH',
      biometricPoints: 4,
    });

    expect(snapshot[0]).toMatchObject({ label: 'Ciclo', value: 'V13 · Lote 2026-07' });
    expect(snapshot[1]).toMatchObject({ label: 'Janela ideal', value: 'S12-S14' });
  });

  it('builds a harvest route with cycle context', () => {
    expect(buildDespescaPath('cycle-123', 'chart')).toBe('/despesca?cycleId=cycle-123&focus=chart');
  });
});
