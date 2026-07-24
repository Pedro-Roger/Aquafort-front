import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  InventoryBalanceRow,
  InventoryLocation,
  InventoryLocationType,
  InventoryMovement,
  InventoryMovementType,
  InventorySummary,
} from '../types'

interface InventoryBalanceParams {
  productId?: string
  locationId?: string
}

interface InventoryMovementParams extends InventoryBalanceParams {
  movementType?: InventoryMovementType
}

interface CreateInventoryLocationDto {
  code: string
  name: string
  type: InventoryLocationType
  parentId?: string
  active?: boolean
}

interface CreateInventoryMovementDto {
  productId: string
  movementType: InventoryMovementType
  quantityKg: number
  unitCost?: number
  fromLocationId?: string
  toLocationId?: string
  effectiveAt: string
  notes?: string
  referenceType?: string
  referenceId?: string
}

export function useInventoryLocations() {
  return useQuery<InventoryLocation[]>({
    queryKey: ['inventory', 'locations'],
    queryFn: async () => (await api.get('/v1/inventory/locations')).data,
  })
}

export function useInventoryBalances(params?: InventoryBalanceParams) {
  return useQuery<InventoryBalanceRow[]>({
    queryKey: ['inventory', 'balances', params],
    queryFn: async () => (await api.get('/v1/inventory/balances', { params })).data,
  })
}

export function useInventoryMovements(params?: InventoryMovementParams) {
  return useQuery<InventoryMovement[]>({
    queryKey: ['inventory', 'movements', params],
    queryFn: async () => (await api.get('/v1/inventory/movements', { params })).data,
  })
}

export function useInventorySummary() {
  return useQuery<InventorySummary>({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => (await api.get('/v1/inventory/summary')).data,
  })
}

export function useCreateInventoryLocation() {
  const qc = useQueryClient()
  return useMutation<InventoryLocation, Error, CreateInventoryLocationDto>({
    mutationFn: async (dto) => (await api.post('/v1/inventory/locations', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useCreateInventoryMovement() {
  const qc = useQueryClient()
  return useMutation<InventoryMovement, Error, CreateInventoryMovementDto>({
    mutationFn: async (dto) => (await api.post('/v1/inventory/movements', dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
