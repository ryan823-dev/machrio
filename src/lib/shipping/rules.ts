export const FREE_SHIPPING_THRESHOLD_USD = 200
export const DEFAULT_SHIPPING_PROCESSING_DAYS = 3

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`
}
