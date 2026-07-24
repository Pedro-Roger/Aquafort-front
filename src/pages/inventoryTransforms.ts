import type { InventoryBalanceRow, InventoryLocationType, InventoryMovement } from '../types'

export interface InventoryLocationBalanceCard {
  locationId: string
  locationName: string
  locationType: InventoryLocationType
  skuCount: number
  totalQuantityKg: number
  items: InventoryBalanceRow[]
}

export function groupBalancesByLocation(balances: InventoryBalanceRow[]) {
  const groups = new Map<string, InventoryLocationBalanceCard>()

  for (const balance of balances) {
    const current = groups.get(balance.locationId) ?? {
      locationId: balance.locationId,
      locationName: balance.locationName,
      locationType: balance.locationType,
      skuCount: 0,
      totalQuantityKg: 0,
      items: [],
    }

    current.items.push(balance)
    current.skuCount += 1
    current.totalQuantityKg = Number((current.totalQuantityKg + balance.quantityKg).toFixed(3))
    groups.set(balance.locationId, current)
  }

  return Array.from(groups.values()).sort((a, b) => a.locationName.localeCompare(b.locationName))
}

export function formatMovementLabel(movement: InventoryMovement) {
  if (movement.movementType === 'INBOUND') return 'Entrada'
  if (movement.movementType === 'OUTBOUND') return 'Saida'
  if (movement.movementType === 'TRANSFER') return 'Transferencia'
  return 'Ajuste'
}
