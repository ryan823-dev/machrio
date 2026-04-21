export interface OrderLookupDraft {
  orderNumber?: string
  email?: string
}

interface RequestAccessResponse {
  orderPath?: string
  orderUrl?: string
  error?: string
  retryAfterSeconds?: number
}

function normalizeOrderNumber(value: string) {
  return value.trim().toUpperCase()
}

export function extractOrderLookupDraft(text: string): OrderLookupDraft {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const orderMatch = text.match(/\bMCH-[A-Z0-9-]+\b/i)

  return {
    orderNumber: orderMatch ? normalizeOrderNumber(orderMatch[0]) : undefined,
    email: emailMatch ? emailMatch[0].trim().toLowerCase() : undefined,
  }
}

export function mergeOrderLookupDraft(
  currentDraft: OrderLookupDraft | null,
  text: string,
): OrderLookupDraft {
  const extracted = extractOrderLookupDraft(text)

  return {
    orderNumber: extracted.orderNumber || currentDraft?.orderNumber,
    email: extracted.email || currentDraft?.email,
  }
}

export function getOrderLookupPrompt(draft?: OrderLookupDraft | null) {
  if (!draft?.orderNumber && !draft?.email) {
    return 'Sure — send me your order number and the purchasing email address, and I will look up the order for you. You can send both in one message or one at a time.'
  }

  if (draft.orderNumber && !draft.email) {
    return `I found the order number ${draft.orderNumber}. Now send me the purchasing email address and I will generate your secure order link.`
  }

  if (!draft.orderNumber && draft.email) {
    return `I found the purchasing email ${draft.email}. Now send me the order number and I will generate your secure order link.`
  }

  return 'I have what I need. Let me check that order for you now.'
}

function buildRetryHint(seconds?: number) {
  if (typeof seconds !== 'number') return ''
  if (seconds < 60) return ` Please try again in ${seconds} seconds.`

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return ` Please try again in ${minutes} minutes.`
  }

  return ` Please try again in ${minutes} minutes ${remainingSeconds} seconds.`
}

export async function requestDirectOrderLookup(draft: Required<OrderLookupDraft>) {
  const response = await fetch('/api/orders/request-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderNumber: draft.orderNumber,
      email: draft.email,
      mode: 'direct',
    }),
  })

  const data = await response.json().catch(() => ({})) as RequestAccessResponse

  if (!response.ok) {
    return {
      success: false as const,
      error: (data.error || 'I could not verify that order number and purchasing email combination.')
        + buildRetryHint(data.retryAfterSeconds),
    }
  }

  return {
    success: true as const,
    orderPath: data.orderPath || data.orderUrl || '',
  }
}
