import type { FeedProduct } from '../types'

export function summarizeInventory(products: FeedProduct[]) {
  const totalItems = products.length
  const activeItems = products.filter((product) => product.active).length
  const inactiveItems = totalItems - activeItems

  const prices = products.filter((product) => product.priceKg !== null && product.priceKg !== undefined).map((product) => Number(product.priceKg))
  const bags = products.filter((product) => product.bagWeightKg !== null && product.bagWeightKg !== undefined).map((product) => Number(product.bagWeightKg))

  return {
    totalItems,
    activeItems,
    inactiveItems,
    averagePriceKg: average(prices),
    averageBagWeightKg: average(bags),
  }
}

function average(values: number[]) {
  if (!values.length) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}
