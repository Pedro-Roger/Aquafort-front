import { describe, expect, it } from 'vitest'
import { summarizeInventory } from './inventoryMetrics'
import type { FeedProduct } from '../types'

describe('summarizeInventory', () => {
  it('computes catalog metrics from feed products', () => {
    const products: FeedProduct[] = [
      { id: '1', name: 'Racao 35', priceKg: 5.2, bagWeightKg: 25, active: true, createdAt: '2026-01-01' },
      { id: '2', name: 'Probiotico', priceKg: 12, bagWeightKg: 1, active: true, createdAt: '2026-01-01' },
      { id: '3', name: 'Antigo', priceKg: 4.8, bagWeightKg: 20, active: false, createdAt: '2026-01-01' },
    ]

    expect(summarizeInventory(products)).toEqual({
      totalItems: 3,
      activeItems: 2,
      inactiveItems: 1,
      averagePriceKg: 7.33,
      averageBagWeightKg: 15.33,
    })
  })
})
