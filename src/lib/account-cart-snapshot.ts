import type { CartItem } from '@/contexts/CartContext'

export interface AccountCartSnapshot {
  items: CartItem[]
  selectedProductIds: string[]
  shippingCountry: string
  shippingMethodCode: string
}

const ACCOUNT_CART_SNAPSHOT_PREFIX = 'machrio_account_cart_snapshot:'

function buildSnapshotKey(email: string) {
  return `${ACCOUNT_CART_SNAPSHOT_PREFIX}${email.trim().toLowerCase()}`
}

export function readAccountCartSnapshot(email: string): AccountCartSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(buildSnapshotKey(email))
    if (!stored) return null

    const parsed = JSON.parse(stored) as Partial<AccountCartSnapshot>
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
      return null
    }

    return {
      items: parsed.items,
      selectedProductIds: Array.isArray(parsed.selectedProductIds)
        ? parsed.selectedProductIds.filter((value): value is string => typeof value === 'string')
        : [],
      shippingCountry: typeof parsed.shippingCountry === 'string' && parsed.shippingCountry
        ? parsed.shippingCountry
        : 'US',
      shippingMethodCode: typeof parsed.shippingMethodCode === 'string'
        ? parsed.shippingMethodCode
        : '',
    }
  } catch {
    return null
  }
}

export function writeAccountCartSnapshot(email: string, snapshot: AccountCartSnapshot) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(buildSnapshotKey(email), JSON.stringify(snapshot))
}
