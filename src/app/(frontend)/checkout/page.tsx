'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import StripePayment from '@/components/StripePayment'
import { FREE_SHIPPING_THRESHOLD_USD, formatUsd } from '@/lib/shipping/rules'
import { fetchWithAuth } from '@/lib/account'
import { appendQueryParamsToPath } from '@/lib/order-access-links'

interface CheckoutForm {
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

const initialForm: CheckoutForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  companyLegalName: '',
  taxId: '',
  billingAddress: '',
  paymentMethod: 'stripe',
  preferredCurrency: 'USD',
  notes: '',
}

interface AccountProfile {
  name: string
  company: string
  phone: string
  email: string
}

interface SavedShippingAddress {
  label: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

const SHIPPING_ADDRESS_FORM_FIELDS = ['address', 'city', 'state', 'postalCode', 'country'] as const
type ShippingAddressFormField = (typeof SHIPPING_ADDRESS_FORM_FIELDS)[number]

interface BillingInfo {
  companyLegalName: string
  taxId: string
  billingAddress: string
}

const COUNTRY_CURRENCY_MAP: { code: string; name: string; flag: string; currency: string; currencyName: string }[] = [
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', currency: 'USD', currencyName: 'US Dollar' },
  { code: 'HK', name: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}', currency: 'HKD', currencyName: 'HK Dollar' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', currency: 'EUR', currencyName: 'Euro' },
  { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', currency: 'GBP', currencyName: 'British Pound' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', currency: 'CAD', currencyName: 'Canadian Dollar' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', currency: 'AUD', currencyName: 'Australian Dollar' },
  { code: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', currency: 'NZD', currencyName: 'NZ Dollar' },
  { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}', currency: 'SGD', currencyName: 'Singapore Dollar' },
  { code: 'AE', name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}', currency: 'AED', currencyName: 'UAE Dirham' },
  { code: 'MX', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}', currency: 'MXN', currencyName: 'Mexican Peso' },
  { code: 'PH', name: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}', currency: 'PHP', currencyName: 'Philippine Peso' },
  { code: 'ID', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}', currency: 'IDR', currencyName: 'Indonesian Rupiah' },
  { code: 'IL', name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}', currency: 'ILS', currencyName: 'Israeli Shekel' },
  { code: 'DK', name: 'Denmark', flag: '\u{1F1E9}\u{1F1F0}', currency: 'DKK', currencyName: 'Danish Krone' },
  { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}', currency: 'CNY', currencyName: 'Chinese Yuan' },
]

const SUPPORTED_BANK_TRANSFER_CURRENCIES = new Set(['USD', 'HKD', 'EUR', 'GBP', 'CAD', 'CNY'])
const BANK_TRANSFER_CURRENCY_OPTIONS = COUNTRY_CURRENCY_MAP.filter(
  (option, index, options) =>
    SUPPORTED_BANK_TRANSFER_CURRENCIES.has(option.currency)
    && index === options.findIndex(candidate => candidate.currency === option.currency)
)

function getPreferredCurrencyForCountry(country: string): string {
  const match = COUNTRY_CURRENCY_MAP.find(option => option.code === country)
  if (!match || !SUPPORTED_BANK_TRANSFER_CURRENCIES.has(match.currency)) {
    return 'USD'
  }

  return match.currency
}

function buildAccountProfile(value: unknown): AccountProfile {
  const profile = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}

  return {
    name: typeof profile.name === 'string' ? profile.name : '',
    company: typeof profile.company === 'string' ? profile.company : '',
    phone: typeof profile.phone === 'string' ? profile.phone : '',
    email: typeof profile.email === 'string' ? profile.email : '',
  }
}

function buildSavedShippingAddresses(value: unknown): SavedShippingAddress[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      const address = entry && typeof entry === 'object'
        ? entry as Record<string, unknown>
        : {}

      return {
        label: typeof address.label === 'string' ? address.label : '',
        address: typeof address.address === 'string' ? address.address : '',
        city: typeof address.city === 'string' ? address.city : '',
        state: typeof address.state === 'string' ? address.state : '',
        postalCode: typeof address.postalCode === 'string' ? address.postalCode : '',
        country: typeof address.country === 'string' && address.country ? address.country : 'US',
      }
    })
    .filter((address) => (
      Boolean(
        address.address.trim()
        || address.city.trim()
        || address.state.trim()
        || address.postalCode.trim(),
      )
    ))
}

function normalizeComparableText(value: string): string {
  return value.trim().toLowerCase()
}

function getSavedShippingAddressTitle(address: SavedShippingAddress, index: number): string {
  return address.label.trim() || `Saved Address ${index + 1}`
}

function getSavedShippingAddressSummary(address: SavedShippingAddress): string {
  return [
    address.address,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country,
  ]
    .filter((value) => value && value.trim())
    .join(' • ')
}

function buildBillingInfo(value: unknown): BillingInfo {
  const billing = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}

  return {
    companyLegalName: typeof billing.companyLegalName === 'string' ? billing.companyLegalName : '',
    taxId: typeof billing.taxId === 'string' ? billing.taxId : '',
    billingAddress: typeof billing.billingAddress === 'string' ? billing.billingAddress : '',
  }
}

// 嵌入式支付订单信息
interface PendingOrder {
  orderNumber: string
  orderPath: string
  invoicePath?: string
  amount: number
  currency: string
  clientSecret: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const {
    items, selectedItems, itemCount, subtotal, shippingCost, total,
    shippingMethodCode, shippingQuotes, shippingLoading, estimatedShipDate, totalWeight,
    clearCart, setShippingCountry, setShippingMethod, hasLiveShippingQuote,
  } = useCart()
  const [form, setForm] = useState<CheckoutForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // 嵌入式支付状态
  const [showStripePayment, setShowStripePayment] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null)
  const [isAuthenticatedAccount, setIsAuthenticatedAccount] = useState(false)
  const [savedShippingAddresses, setSavedShippingAddresses] = useState<SavedShippingAddress[]>([])
  const [shippingAddressMode, setShippingAddressMode] = useState<'saved' | 'new'>('new')
  const [selectedSavedAddressIndex, setSelectedSavedAddressIndex] = useState<number | null>(null)
  const [isPayPalAvailable, setIsPayPalAvailable] = useState(false)
  const [hasCheckedPayPalAvailability, setHasCheckedPayPalAvailability] = useState(false)
  const touchedFieldsRef = useRef<Set<keyof CheckoutForm>>(new Set())
  const accountPrefillRequestedRef = useRef(false)

  // Only show selected items
  const selectedCartItems = items.filter(i => selectedItems.has(i.productId))
  const selectedQuote = shippingQuotes.find(q => q.code === shippingMethodCode)
  const shippingDisplay = selectedQuote
    ? (selectedQuote.isFreeShipping ? 'FREE' : `$${selectedQuote.cost.toFixed(2)}`)
    : shippingLoading
      ? 'Updating...'
      : 'Quote required'
  const totalDisplay = selectedQuote
    ? `$${total.toFixed(2)}`
    : shippingLoading
      ? 'Updating...'
      : 'Awaiting quote'
  const canSubmitOrder = Boolean(selectedQuote)
  const selectedSavedAddress = selectedSavedAddressIndex !== null
    ? savedShippingAddresses[selectedSavedAddressIndex] || null
    : null

  function applyShippingAddress(address: SavedShippingAddress, nextMode: 'saved' | 'new', index: number | null) {
    setShippingAddressMode(nextMode)
    setSelectedSavedAddressIndex(index)
    setForm((current) => ({
      ...current,
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      preferredCurrency: touchedFieldsRef.current.has('preferredCurrency')
        ? current.preferredCurrency
        : getPreferredCurrencyForCountry(address.country),
    }))
    setShippingCountry(address.country)
  }

  function handleSelectSavedAddress(index: number) {
    const nextAddress = savedShippingAddresses[index]
    if (!nextAddress) return

    applyShippingAddress(nextAddress, 'saved', index)
  }

  function handleUseNewAddress() {
    applyShippingAddress({
      label: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    }, 'new', null)
  }

  useEffect(() => {
    let cancelled = false

    async function loadPaymentAvailability() {
      try {
        const response = await fetch('/api/paypal/config', {
          cache: 'no-store',
        })
        const data = await response.json().catch(() => ({}))

        if (cancelled) return

        setIsPayPalAvailable(Boolean(data.configured))
      } catch (paymentAvailabilityError) {
        if (!cancelled) {
          console.error('Failed to load PayPal availability:', paymentAvailabilityError)
        }
      } finally {
        if (!cancelled) {
          setHasCheckedPayPalAvailability(true)
        }
      }
    }

    loadPaymentAvailability()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (accountPrefillRequestedRef.current) return

    accountPrefillRequestedRef.current = true
    let cancelled = false

    async function loadAccountPrefill() {
      try {
        const [profileRes, addressesRes, billingRes] = await Promise.all([
          fetchWithAuth('/api/account/profile'),
          fetchWithAuth('/api/account/addresses'),
          fetchWithAuth('/api/account/billing'),
        ])

        if (
          [profileRes.status, addressesRes.status, billingRes.status].every(
            (status) => status === 401,
          )
        ) {
          return
        }

        const [profileJson, addressesJson, billingJson] = await Promise.all([
          profileRes.json().catch(() => ({})),
          addressesRes.json().catch(() => ({})),
          billingRes.json().catch(() => ({})),
        ])

        if (cancelled) return

        const profile = profileRes.ok ? buildAccountProfile(profileJson.profile) : null
        const shippingAddresses = addressesRes.ok
          ? buildSavedShippingAddresses(addressesJson.addresses)
          : []
        const shippingAddress = shippingAddresses[0] || null
        const billingInfo = billingRes.ok
          ? buildBillingInfo(billingJson.billing)
          : buildBillingInfo(null)
        const shippingFieldsTouched = SHIPPING_ADDRESS_FORM_FIELDS.some((field) => (
          touchedFieldsRef.current.has(field)
        ))

        setIsAuthenticatedAccount(profileRes.ok || addressesRes.ok || billingRes.ok)
        setSavedShippingAddresses(shippingAddresses)

        if (!shippingFieldsTouched && shippingAddresses.length > 0) {
          setShippingAddressMode('saved')
          setSelectedSavedAddressIndex(0)
        }

        let countryForShippingQuote: string | null = null
        setForm((current) => {
          const touchedFields = touchedFieldsRef.current
          const nextCountry = !touchedFields.has('country') && shippingAddress?.country
            ? shippingAddress.country
            : current.country

          const nextForm: CheckoutForm = {
            ...current,
            name: !touchedFields.has('name') && !current.name.trim()
              ? profile?.name || current.name
              : current.name,
            email: !touchedFields.has('email') && !current.email.trim()
              ? profile?.email || current.email
              : current.email,
            phone: !touchedFields.has('phone') && !current.phone.trim()
              ? profile?.phone || current.phone
              : current.phone,
            company: !touchedFields.has('company') && !current.company.trim()
              ? profile?.company || current.company
              : current.company,
            address: !touchedFields.has('address') && !current.address.trim()
              ? shippingAddress?.address || current.address
              : current.address,
            city: !touchedFields.has('city') && !current.city.trim()
              ? shippingAddress?.city || current.city
              : current.city,
            state: !touchedFields.has('state') && !current.state.trim()
              ? shippingAddress?.state || current.state
              : current.state,
            postalCode: !touchedFields.has('postalCode') && !current.postalCode.trim()
              ? shippingAddress?.postalCode || current.postalCode
              : current.postalCode,
            country: nextCountry,
            companyLegalName: !touchedFields.has('companyLegalName') && !current.companyLegalName.trim()
              ? billingInfo.companyLegalName || current.companyLegalName
              : current.companyLegalName,
            taxId: !touchedFields.has('taxId') && !current.taxId.trim()
              ? billingInfo.taxId || current.taxId
              : current.taxId,
            billingAddress: !touchedFields.has('billingAddress') && !current.billingAddress.trim()
              ? billingInfo.billingAddress || current.billingAddress
              : current.billingAddress,
            preferredCurrency: !touchedFields.has('preferredCurrency') && nextCountry !== current.country
              ? getPreferredCurrencyForCountry(nextCountry)
              : current.preferredCurrency,
          }

          if (nextCountry !== current.country) {
            countryForShippingQuote = nextCountry
          }

          return nextForm
        })

        if (countryForShippingQuote) {
          setShippingCountry(countryForShippingQuote)
        }
      } catch (prefillError) {
        console.error('Failed to load checkout account prefill:', prefillError)
      }
    }

    loadAccountPrefill()

    return () => {
      cancelled = true
    }
  }, [setShippingCountry])

  function updateField(field: keyof CheckoutForm, value: string) {
    touchedFieldsRef.current.add(field)
    if (field === 'country') {
      setShippingCountry(value)
    }

    if (
      SHIPPING_ADDRESS_FORM_FIELDS.includes(field as ShippingAddressFormField)
      && shippingAddressMode === 'saved'
      && selectedSavedAddress
    ) {
      const selectedValue = selectedSavedAddress[field as ShippingAddressFormField]
      if (normalizeComparableText(value) !== normalizeComparableText(selectedValue)) {
        setShippingAddressMode('new')
        setSelectedSavedAddressIndex(null)
      }
    }

    setForm(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-set currency when country changes (if bank transfer selected)
      if (field === 'country') {
        updated.preferredCurrency = getPreferredCurrencyForCountry(value)
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedQuote) {
      setError('A live shipping quote is required before you can place this order.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            company: form.company,
          },
          shipping: {
            address: form.address,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
          },
          billing: {
            companyLegalName: form.companyLegalName,
            taxId: form.taxId,
            billingAddress: form.billingAddress,
          },
          items: selectedCartItems.map(item => ({
            product: item.productId,
            productName: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal: item.price * item.quantity,
          })),
          subtotal,
          shippingCost,
          total,
          currency: form.paymentMethod === 'bank-transfer' ? form.preferredCurrency : 'USD',
          paymentMethod: form.paymentMethod,
          shippingMethodCode: shippingMethodCode || undefined,
          customerNotes: form.notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      if (form.paymentMethod === 'stripe') {
        if (!data.stripeClientSecret) {
          throw new Error('Failed to initialize Stripe payment')
        }

        // 嵌入式支付：显示 StripePayment 组件
        // 注意：不要在这里清空购物车，支付成功后再清空
        setPendingOrder({
          orderNumber: data.orderNumber,
          orderPath: data.orderPath,
          invoicePath: data.invoicePath,
          amount: data.total,
          currency: data.currency,
          clientSecret: data.stripeClientSecret,
        })
        setShowStripePayment(true)
        setSubmitting(false)
      } else {
        if (form.paymentMethod === 'paypal') {
          if (!data.approvalUrl) {
            throw new Error('Failed to initialize PayPal payment')
          }

          // Redirect to PayPal for payment
          clearCart()
          window.location.href = data.approvalUrl
        } else {
          // Bank transfer - go to order confirmation with invoice
          clearCart()
          router.push(data.orderPath)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // 嵌入式支付成功回调
  function handleStripeSuccess() {
    clearCart() // 支付成功后清空购物车
    setShowStripePayment(false)
    if (!pendingOrder) return

    router.push(appendQueryParamsToPath(pendingOrder.orderPath, {
      payment: 'success',
      provider: 'stripe',
    }))
  }

  // 嵌入式支付失败回调
  function handleStripeError(message: string) {
    setError(`Payment failed: ${message}. You can try again or use another payment method.`)
  }

  // 取消嵌入式支付，回退到跳转式支付
  function handleStripeCancel() {
    setShowStripePayment(false)
    router.push(appendQueryParamsToPath('/cart', {
      payment: 'cancelled',
      provider: 'stripe',
      order: pendingOrder?.orderNumber,
    }))
  }

  // 嵌入式支付模式：优先显示支付表单（即使购物车已清空）
  if (showStripePayment && pendingOrder) {
    return (
      <div className="container-main py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-secondary-900 mb-6">Complete Your Payment</h1>
          <p className="text-secondary-600 mb-4">
            Order <span className="font-semibold">{pendingOrder.orderNumber}</span> has been created.
            Please complete your payment below.
          </p>
          <StripePayment
            orderPath={appendQueryParamsToPath(pendingOrder.orderPath, {
              provider: 'stripe',
            })}
            amount={pendingOrder.amount}
            currency={pendingOrder.currency}
            clientSecret={pendingOrder.clientSecret}
            onSuccess={handleStripeSuccess}
            onError={handleStripeError}
            onCancel={handleStripeCancel}
          />
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (itemCount === 0) {
    return (
      <div className="container-main py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary-900">No items to checkout</h1>
        <p className="mt-2 text-secondary-500">Your cart is empty.</p>
        <Link href="/category" className="btn-primary mt-6 inline-block">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="container-main py-8">
      <h1 className="text-2xl font-bold text-secondary-900">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Left: Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Customer Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Company *</label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={e => updateField('company', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="john@acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-secondary-900">Shipping Address</h2>
                {savedShippingAddresses.length > 0 ? (
                  <p className="mt-1 text-sm text-secondary-500">
                    Choose a saved address or switch to a new delivery location for this order.
                  </p>
                ) : isAuthenticatedAccount ? (
                  <p className="mt-1 text-sm text-secondary-500">
                    No saved shipping addresses yet. Enter a new one below and we&apos;ll save it after checkout.
                  </p>
                ) : null}
              </div>
              {savedShippingAddresses.length > 0 && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  shippingAddressMode === 'saved'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-secondary-100 text-secondary-700'
                }`}>
                  {shippingAddressMode === 'saved' ? 'Using saved address' : 'Creating a new address'}
                </span>
              )}
            </div>

            {savedShippingAddresses.length > 0 && (
              <div className="mt-4 space-y-3">
                {savedShippingAddresses.map((address, index) => {
                  const isActive = shippingAddressMode === 'saved' && selectedSavedAddressIndex === index

                  return (
                    <button
                      key={`saved-shipping-address-${index}`}
                      type="button"
                      onClick={() => handleSelectSavedAddress(index)}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        isActive
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-secondary-900">
                            {getSavedShippingAddressTitle(address, index)}
                          </p>
                          <p className="mt-1 text-sm text-secondary-600">
                            {getSavedShippingAddressSummary(address)}
                          </p>
                        </div>
                        {isActive && (
                          <span className="rounded-full bg-primary-600 px-2 py-1 text-xs font-semibold text-white">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={handleUseNewAddress}
                  className={`w-full rounded-lg border border-dashed p-4 text-left transition ${
                    shippingAddressMode === 'new'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-300 text-secondary-700 hover:border-primary-300 hover:bg-secondary-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-secondary-900">Use a new shipping address</p>
                  <p className="mt-1 text-sm text-secondary-500">
                    Start with a blank form. If you place the order while signed in, we&apos;ll remember it for later.
                  </p>
                </button>
              </div>
            )}

            {shippingAddressMode === 'saved' && selectedSavedAddress && (
              <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
                Editing the fields below will switch this order to a new shipping address while keeping your saved address intact.
              </div>
            )}

            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Street Address *</label>
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={e => updateField('address', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="123 Industrial Blvd, Suite 100"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={e => updateField('city', e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={e => updateField('state', e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={e => updateField('postalCode', e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Country *</label>
                  <select
                    required
                    value={form.country}
                    onChange={e => updateField('country', e.target.value)}
                    className="input-field mt-1 w-full"
                  >
                    {COUNTRY_CURRENCY_MAP.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Billing & Tax */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Billing & Tax</h2>
            <p className="mt-1 text-sm text-secondary-500">
              Optional, but useful if you need invoice details prefilled for repeat orders.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-secondary-700">Legal Company Name</label>
                <input
                  type="text"
                  value={form.companyLegalName}
                  onChange={e => updateField('companyLegalName', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="Acme Industrial Supplies LLC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700">Tax ID / VAT Number</label>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={e => updateField('taxId', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="VAT / GST / EIN"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-secondary-700">Billing Address</label>
                <textarea
                  rows={2}
                  value={form.billingAddress}
                  onChange={e => updateField('billingAddress', e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="Invoice address if different from shipping"
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Payment Method</h2>
            <div className="mt-4 space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentMethod === 'stripe' ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={form.paymentMethod === 'stripe'}
                  onChange={() => updateField('paymentMethod', 'stripe')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-semibold text-secondary-900">Pay Online (Credit Card)</span>
                  <p className="mt-0.5 text-xs text-secondary-500">
                    Secure payment via Stripe. Visa, Mastercard, Amex accepted.
                  </p>
                </div>
              </label>
              {isPayPalAvailable ? (
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentMethod === 'paypal' ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={form.paymentMethod === 'paypal'}
                    onChange={() => updateField('paymentMethod', 'paypal')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-semibold text-secondary-900">PayPal</span>
                    <p className="mt-0.5 text-xs text-secondary-500">
                      Pay securely with your PayPal account or debit/credit card.
                    </p>
                  </div>
                </label>
              ) : null}
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${form.paymentMethod === 'bank-transfer' ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:bg-secondary-50'}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank-transfer"
                  checked={form.paymentMethod === 'bank-transfer'}
                  onChange={() => updateField('paymentMethod', 'bank-transfer')}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-semibold text-secondary-900">Bank Transfer / Wire</span>
                  <p className="mt-0.5 text-xs text-secondary-500">
                    A Proforma Invoice with bank details will be generated after order placement.
                  </p>
                </div>
              </label>

              {/* Currency selector for bank transfer */}
              {form.paymentMethod === 'bank-transfer' && (
                <div className="ml-7 mt-1 rounded-lg border border-primary-200 bg-primary-50/50 p-4">
                  <label className="block text-sm font-medium text-secondary-700">
                    Preferred Payment Currency
                  </label>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    Choose from our supported bank transfer currencies for invoicing.
                  </p>
                  <select
                    value={form.preferredCurrency}
                    onChange={e => updateField('preferredCurrency', e.target.value)}
                    className="input-field mt-2 w-full"
                  >
                    {BANK_TRANSFER_CURRENCY_OPTIONS.map(c => (
                      <option key={c.currency + c.code} value={c.currency}>
                        {c.flag} {c.currency} - {c.currencyName}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const match = BANK_TRANSFER_CURRENCY_OPTIONS.find(c => c.currency === form.preferredCurrency)
                    return match ? (
                      <p className="mt-2 text-xs text-primary-700">
                        {match.flag} Your invoice will include our <strong>{match.name}</strong> bank account for <strong>{match.currency}</strong> payment.
                      </p>
                    ) : null
                  })()}
                </div>
              )}

              {hasCheckedPayPalAvailability && !isPayPalAvailable && (
                <p className="text-xs text-secondary-500">
                  PayPal is temporarily unavailable in this environment. Please use Stripe or bank transfer for now.
                </p>
              )}
            </div>
          </section>

          {/* Order Notes */}
          <section className="rounded-lg border border-secondary-200 bg-white p-6">
            <h2 className="text-lg font-bold text-secondary-900">Order Notes (Optional)</h2>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              className="input-field mt-3 w-full"
              placeholder="Special instructions, delivery requirements, etc."
            />
          </section>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-secondary-200 bg-white p-6 sticky top-24">
            <h2 className="text-lg font-bold text-secondary-900">Order Summary</h2>

            {/* Items */}
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {selectedCartItems.map(item => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <div className="flex-1 pr-2">
                    <p className="text-secondary-800 font-medium truncate">{item.name}</p>
                    <p className="text-xs text-secondary-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-secondary-700 whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Shipping method display */}
            {shippingLoading ? (
              <div className="mt-4 flex items-center gap-2 text-xs text-secondary-500">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating shipping...
              </div>
            ) : shippingQuotes.length > 0 ? (
              <div className="mt-4 border-t border-secondary-200 pt-3">
                <div className="mb-2 space-y-1">
                  <label className="block text-xs font-medium text-secondary-600">Shipping Method</label>
                  <p className="text-xs leading-relaxed text-secondary-500">
                    Shipping is calculated from total shipment weight and destination. Orders over{' '}
                    {formatUsd(FREE_SHIPPING_THRESHOLD_USD)} ship free.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {shippingQuotes.map((q) => (
                    <label
                      key={q.code}
                      className={`flex items-center gap-2 rounded border p-2 cursor-pointer text-xs transition-colors ${
                        shippingMethodCode === q.code
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-secondary-200 hover:bg-secondary-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="checkoutShipping"
                        checked={shippingMethodCode === q.code}
                        onChange={() => setShippingMethod(q.code)}
                      />
                      <span className="flex-1 font-medium text-secondary-800">{q.name}</span>
                      <span className={`font-semibold ${q.isFreeShipping ? 'text-green-600' : 'text-secondary-900'}`}>
                        {q.isFreeShipping ? 'FREE' : `$${q.cost.toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedQuote && (
                  <div className="mt-2 space-y-1 text-xs text-secondary-500">
                    <p>
                      Total shipment weight: <span className="font-medium text-secondary-700">{totalWeight.toFixed(totalWeight >= 10 ? 1 : 2)} kg</span>
                    </p>
                    <p>
                      Ships {estimatedShipDate} &bull; Arrives by {selectedQuote.estimatedDeliveryDate}
                    </p>
                    {!selectedQuote.isFreeShipping && selectedQuote.gapToFreeShipping !== undefined && selectedQuote.gapToFreeShipping > 0 && (
                      <p className="font-medium text-green-700">
                        Add {formatUsd(selectedQuote.gapToFreeShipping)} more to unlock free shipping.
                      </p>
                    )}
                    {selectedQuote.isFreeShipping && (
                      <p className="font-medium text-green-700">
                        Free shipping has been applied to this order.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <p className="font-medium">We do not have a live shipping rate for this destination yet.</p>
                <p className="mt-1">
                  Update the shipping country or contact <a href="mailto:sales@machrio.com" className="underline">sales@machrio.com</a> for a manual freight quote.
                </p>
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 border-t border-secondary-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-secondary-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary-600">
                <span>Shipping</span>
                <span>{shippingDisplay}</span>
              </div>
              <div className="border-t border-secondary-200 pt-2 flex justify-between font-bold text-secondary-900 text-base">
                <span>Total</span>
                <span>{totalDisplay}</span>
              </div>
            </div>

            {!shippingLoading && !hasLiveShippingQuote && (
              <p className="mt-3 text-xs text-amber-600">
                Orders can only be placed once a live shipping method is available for the selected destination.
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !canSubmitOrder}
              className="btn-primary mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Placing Order...' : canSubmitOrder ? 'Place Order' : 'Shipping Quote Required'}
            </button>

            <Link href="/cart" className="mt-3 block text-center text-sm text-secondary-500 hover:text-primary-700">
              Back to Cart
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
