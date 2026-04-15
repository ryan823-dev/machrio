export type PurchaseMode = 'both' | 'buy-online' | 'rfq-only'

export function normalizePurchaseMode(value?: string | null): PurchaseMode {
  if (!value) return 'both'

  const normalized = value.toLowerCase().trim()

  if (normalized === 'both') return 'both'
  if (normalized === 'buy-online' || normalized === 'buy online') return 'buy-online'
  if (
    normalized === 'rfq-only' ||
    normalized === 'rfq only' ||
    normalized === 'quote-only' ||
    normalized === 'quote only' ||
    normalized === 'rfq' ||
    normalized === 'quote'
  ) {
    return 'rfq-only'
  }

  const mentionsBuyOnline =
    normalized.includes('buy online') ||
    normalized.includes('buy-online') ||
    normalized.includes('checkout') ||
    normalized.includes('cart')
  const mentionsQuote =
    normalized.includes('rfq') ||
    normalized.includes('quote') ||
    normalized.includes('contact') ||
    normalized.includes('inquiry') ||
    normalized.includes('enquiry') ||
    normalized.includes('custom')

  if (mentionsBuyOnline && mentionsQuote) return 'both'
  if (mentionsQuote) return 'rfq-only'
  if (mentionsBuyOnline) return 'buy-online'

  return 'both'
}

export function supportsOnlineCheckout(mode: PurchaseMode): boolean {
  return mode === 'both' || mode === 'buy-online'
}

export function supportsQuoteRequests(mode: PurchaseMode): boolean {
  return mode === 'both' || mode === 'rfq-only'
}
