export interface CheckoutDraft {
  name: string
  email: string
  phone: string
  company: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  companyLegalName: string
  taxId: string
  billingAddress: string
  paymentMethod: 'stripe' | 'paypal' | 'bank-transfer'
  preferredCurrency: string
  notes: string
}

const CHECKOUT_DRAFT_STORAGE_KEY = 'machrio_checkout_draft'

export function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return null

    const draft = parsed as Partial<CheckoutDraft>

    if (
      draft.paymentMethod !== 'stripe'
      && draft.paymentMethod !== 'paypal'
      && draft.paymentMethod !== 'bank-transfer'
    ) {
      return null
    }

    return {
      name: typeof draft.name === 'string' ? draft.name : '',
      email: typeof draft.email === 'string' ? draft.email : '',
      phone: typeof draft.phone === 'string' ? draft.phone : '',
      company: typeof draft.company === 'string' ? draft.company : '',
      address: typeof draft.address === 'string' ? draft.address : '',
      city: typeof draft.city === 'string' ? draft.city : '',
      state: typeof draft.state === 'string' ? draft.state : '',
      postalCode: typeof draft.postalCode === 'string' ? draft.postalCode : '',
      country: typeof draft.country === 'string' && draft.country ? draft.country : 'US',
      companyLegalName: typeof draft.companyLegalName === 'string' ? draft.companyLegalName : '',
      taxId: typeof draft.taxId === 'string' ? draft.taxId : '',
      billingAddress: typeof draft.billingAddress === 'string' ? draft.billingAddress : '',
      paymentMethod: draft.paymentMethod,
      preferredCurrency: typeof draft.preferredCurrency === 'string' && draft.preferredCurrency
        ? draft.preferredCurrency
        : 'USD',
      notes: typeof draft.notes === 'string' ? draft.notes : '',
    }
  } catch {
    return null
  }
}

export function writeCheckoutDraft(draft: CheckoutDraft) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function clearCheckoutDraft() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
}
