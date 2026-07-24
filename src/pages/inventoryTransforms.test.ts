import { describe, expect, it } from 'vitest'
import { groupBalancesByLocation } from './inventoryTransforms'
import type { InventoryBalanceRow } from '../types'

describe('groupBalancesByLocation', () => {
  it('groups balances by location for table rendering', () => {
    const result = groupBalancesByLocation([
      { locationId: 'loc-a', locationName: 'Almox', locationType: 'ALMOXARIFADO', productId: 'prod-1', productName: 'Racao 35', quantityKg: 120 },
      { locationId: 'loc-a', locationName: 'Almox', locationType: 'ALMOXARIFADO', productId: 'prod-2', productName: 'Probiotico', quantityKg: 8 },
    ] as InventoryBalanceRow[])

    expect(result[0]).toEqual(
      expect.objectContaining({
        locationName: 'Almox',
        skuCount: 2,
        totalQuantityKg: 128,
      }),
    )
  })
})
