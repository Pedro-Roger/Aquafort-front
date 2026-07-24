import { describe, expect, it } from 'vitest'
import { buildBiometricFeedTimeline } from './pondInsights'
import type { Biometric, FeedingRecord } from '../../types'

describe('buildBiometricFeedTimeline', () => {
  it('groups feed offered between biometrics and computes growth deltas', () => {
    const biometrics: Biometric[] = [
      {
        id: 'b1',
        cycleId: 'c1',
        measuredAt: '2026-07-05T00:00:00.000Z',
        sampleCount: 30,
        averageWeightG: 4.5,
        survivalRatePct: 88,
        estimatedBiomass: 1200,
        createdAt: '2026-07-05T12:00:00.000Z',
      },
      {
        id: 'b2',
        cycleId: 'c1',
        measuredAt: '2026-07-12T00:00:00.000Z',
        sampleCount: 30,
        averageWeightG: 6.2,
        survivalRatePct: 85,
        estimatedBiomass: 1640,
        createdAt: '2026-07-12T12:00:00.000Z',
      },
    ]

    const feedings: FeedingRecord[] = [
      makeFeeding('f1', '2026-07-02T12:00:00.000Z', 18),
      makeFeeding('f2', '2026-07-04T12:00:00.000Z', 22),
      makeFeeding('f3', '2026-07-08T12:00:00.000Z', 25),
      makeFeeding('f4', '2026-07-11T12:00:00.000Z', 27),
    ]

    const timeline = buildBiometricFeedTimeline({
      biometrics,
      feedings,
      stockDate: '2026-07-01T00:00:00.000Z',
    })

    expect(timeline).toHaveLength(2)
    expect(timeline[0]).toEqual(
      expect.objectContaining({
        biometricId: 'b1',
        cultivationDay: 4,
        feedWindowKg: 40,
        cumulativeFeedKg: 40,
        growthDeltaG: null,
      }),
    )
    expect(timeline[1]).toEqual(
      expect.objectContaining({
        biometricId: 'b2',
        cultivationDay: 11,
        feedWindowKg: 52,
        cumulativeFeedKg: 92,
        growthDeltaG: 1.7,
      }),
    )
  })
})

function makeFeeding(id: string, fedAt: string, feedKg: number): FeedingRecord {
  return {
    id,
    cycleId: 'c1',
    pondId: 'p1',
    mode: 'EXPRESS',
    feedKg,
    feedCost: 0,
    fedAt,
    pond: {
      id: 'p1',
      code: 'VE-01',
      name: 'Viveiro 01',
      type: 'ENGORDA',
      status: 'POVOADO',
      areaHa: 1.4,
      volumeM3: 0,
      farmId: 'farm-1',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    responsible: {
      id: 'u1',
      name: 'Tecnico',
      email: 'tecnico@aquafort.app',
      role: 'TECNICO',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    items: [],
  }
}
