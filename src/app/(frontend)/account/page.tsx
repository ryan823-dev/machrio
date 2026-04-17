'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
import { clearSession, fetchWithAuth } from '@/lib/account'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  name: string
  company: string
  phone: string
  email: string
}

interface EditableProfile extends Profile {
  title: string
}

interface ShippingAddress {
  label: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface BillingInfo {
  companyLegalName: string
  taxId: string
  billingAddress: string
}

interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number | string | null
  currency: string
  itemCount: number
  createdAt: string
}

interface RFQSummary {
  id: string
  status: string
  message: string
  submittedAt: string
}

interface AccountData {
  profile: Profile
  orders: OrderSummary[]
  rfqs: RFQSummary[]
}

interface SectionNotice {
  type: 'success' | 'error'
  message: string
}

interface SendCodeResult {
  success: boolean
  error?: string
  message?: string
  retryAfterSeconds?: number
}

async function requestVerificationCode(email: string): Promise<SendCodeResult> {
  const res = await fetch('/api/account/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return {
      success: false,
      error: data.error || 'Failed to send code',
      retryAfterSeconds:
        typeof data.retryAfterSeconds === 'number' ? data.retryAfterSeconds : undefined,
    }
  }

  return {
    success: true,
    message: data.message || 'Verification code sent to your email',
  }
}

function formatCooldown(seconds: number) {
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`
}

function formatOrderTotal(value: number | string | null | undefined) {
  const normalizedValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue.toFixed(2) : '0.00'
}

const EMPTY_PROFILE: EditableProfile = {
  name: '',
  company: '',
  phone: '',
  title: '',
  email: '',
}

const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  label: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
}

const EMPTY_BILLING_INFO: BillingInfo = {
  companyLegalName: '',
  taxId: '',
  billingAddress: '',
}

function buildEditableProfile(value?: Partial<EditableProfile> | null): EditableProfile {
  return {
    name: value?.name || '',
    company: value?.company || '',
    phone: value?.phone || '',
    title: value?.title || '',
    email: value?.email || '',
  }
}

function buildShippingAddresses(value: unknown): ShippingAddress[] {
  if (!Array.isArray(value)) return []

  return value.map((entry) => {
    const address = entry && typeof entry === 'object'
      ? entry as Record<string, unknown>
      : {}

    return {
      label: typeof address.label === 'string' ? address.label : '',
      address: typeof address.address === 'string' ? address.address : '',
      city: typeof address.city === 'string' ? address.city : '',
      state: typeof address.state === 'string' ? address.state : '',
      postalCode: typeof address.postalCode === 'string' ? address.postalCode : '',
      country: typeof address.country === 'string' && address.country
        ? address.country
        : 'US',
    }
  })
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

function isAddressBlank(address: ShippingAddress) {
  return ![
    address.label,
    address.address,
    address.city,
    address.state,
    address.postalCode,
  ].some((value) => value.trim())
}

// ─── Status Badges ───────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  unpaid: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const RFQ_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-indigo-100 text-indigo-800',
  quoted: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-gray-100 text-gray-800',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}>
      {label}
    </span>
  )
}

function SectionNoticeMessage({ notice }: { notice: SectionNotice | null }) {
  if (!notice) return null

  return (
    <div
      className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
        notice.type === 'success'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {notice.message}
    </div>
  )
}

// ─── Email Step ──────────────────────────────────────────────────────────────

function EmailStep({ onCodeSent }: { onCodeSent: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await requestVerificationCode(normalizedEmail)

      if (!result.success) {
        setError(result.error || 'Failed to send code')
        return
      }

      onCodeSent(normalizedEmail)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-secondary-900">Sign In to Your Account</h1>
      <p className="mt-2 text-secondary-600">
        Enter your email to view order history and quote requests.
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <label htmlFor="email" className="block text-left text-sm font-medium text-secondary-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />

        {error && <p className="mt-2 text-left text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </form>

      <p className="mt-6 text-xs text-secondary-400">
        We&apos;ll send a 6-digit code to your email. No password needed.
      </p>
    </div>
  )
}

// ─── Code Step ───────────────────────────────────────────────────────────────

function CodeStep({
  email,
  onVerified,
  onBack,
}: {
  email: string
  onVerified: () => void
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      const res = await fetch('/api/account/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      onVerified()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    setError('')
    setNotice('')
    setResending(true)

    try {
      const result = await requestVerificationCode(email)

      if (!result.success) {
        if (typeof result.retryAfterSeconds === 'number') {
          setResendCooldown(result.retryAfterSeconds)
        }

        setError(result.error || 'Failed to resend code')
        return
      }

      setResendCooldown(60)
      setNotice(result.message || 'A new verification code has been sent.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-secondary-900">Check Your Email</h2>
      <p className="mt-2 text-secondary-600">
        We sent a 6-digit code to <strong className="text-secondary-800">{email}</strong>
      </p>
      <p className="mt-2 text-xs text-secondary-400">
        If you don&apos;t see it within a minute, check your spam folder or request a new code below.
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <label htmlFor="code" className="block text-left text-sm font-medium text-secondary-700">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-secondary-900 placeholder:text-secondary-300 placeholder:tracking-[0.3em] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          autoFocus
        />

        {error && <p className="mt-2 text-left text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-secondary-500 hover:text-secondary-700">
          &larr; Change email
        </button>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="text-primary-600 hover:text-primary-800 disabled:text-secondary-400"
        >
          {resending
            ? 'Sending...'
            : resendCooldown > 0
              ? `Resend in ${formatCooldown(resendCooldown)}`
              : 'Resend code'}
        </button>
      </div>

      {notice && <p className="mt-3 text-sm text-green-600">{notice}</p>}
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<AccountData | null>(null)
  const [profileForm, setProfileForm] = useState<EditableProfile>(EMPTY_PROFILE)
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([])
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(EMPTY_BILLING_INFO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [addressesSaving, setAddressesSaving] = useState(false)
  const [billingSaving, setBillingSaving] = useState(false)
  const [profileNotice, setProfileNotice] = useState<SectionNotice | null>(null)
  const [addressesNotice, setAddressesNotice] = useState<SectionNotice | null>(null)
  const [billingNotice, setBillingNotice] = useState<SectionNotice | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [dashboardRes, profileRes, addressesRes, billingRes] = await Promise.all([
        fetchWithAuth('/api/account/data'),
        fetchWithAuth('/api/account/profile'),
        fetchWithAuth('/api/account/addresses'),
        fetchWithAuth('/api/account/billing'),
      ])

      const responses = [dashboardRes, profileRes, addressesRes, billingRes]

      if (responses.some((response) => response.status === 401)) {
        onLogout()
        return
      }

      const [dashboardJson, profileJson, addressesJson, billingJson] = await Promise.all(
        responses.map((response) => response.json().catch(() => ({}))),
      )

      if (!dashboardRes.ok || !profileRes.ok || !addressesRes.ok || !billingRes.ok) {
        setError(
          dashboardJson.error
          || profileJson.error
          || addressesJson.error
          || billingJson.error
          || 'Failed to load account data',
        )
        return
      }

      setData(dashboardJson)
      setProfileForm(buildEditableProfile(profileJson.profile || dashboardJson.profile))
      setShippingAddresses(buildShippingAddresses(addressesJson.addresses))
      setBillingInfo(buildBillingInfo(billingJson.billing))
    } catch {
      setError('Failed to load account data')
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/account/logout', { method: 'POST' })
    } catch {
      // Proceed with local logout even if API fails
    }
    clearSession()
    onLogout()
  }

  const handleProfileChange = (field: keyof EditableProfile, value: string) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }))
    setProfileNotice(null)
  }

  const handleAddressChange = (index: number, field: keyof ShippingAddress, value: string) => {
    setShippingAddresses((current) => current.map((address, addressIndex) => (
      addressIndex === index
        ? { ...address, [field]: value }
        : address
    )))
    setAddressesNotice(null)
  }

  const handleAddAddress = () => {
    setShippingAddresses((current) => [...current, { ...EMPTY_SHIPPING_ADDRESS }])
    setAddressesNotice(null)
  }

  const handleRemoveAddress = (index: number) => {
    setShippingAddresses((current) => current.filter((_, addressIndex) => addressIndex !== index))
    setAddressesNotice(null)
  }

  const handleBillingChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo((current) => ({
      ...current,
      [field]: value,
    }))
    setBillingNotice(null)
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileNotice(null)

    try {
      const res = await fetchWithAuth('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          company: profileForm.company,
          phone: profileForm.phone,
          title: profileForm.title,
        }),
      })
      const json = await res.json().catch(() => ({}))

      if (res.status === 401) {
        onLogout()
        return
      }

      if (!res.ok) {
        setProfileNotice({
          type: 'error',
          message: json.error || 'Failed to save profile.',
        })
        return
      }

      const nextProfile = buildEditableProfile(json.profile)
      setProfileForm(nextProfile)
      setData((current) => current ? {
        ...current,
        profile: {
          name: nextProfile.name,
          company: nextProfile.company,
          phone: nextProfile.phone,
          email: nextProfile.email,
        },
      } : current)
      setProfileNotice({
        type: 'success',
        message: 'Profile saved successfully.',
      })
    } catch {
      setProfileNotice({
        type: 'error',
        message: 'Failed to save profile.',
      })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSaveAddresses = async () => {
    setAddressesSaving(true)
    setAddressesNotice(null)

    try {
      const res = await fetchWithAuth('/api/account/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: shippingAddresses.filter((address) => !isAddressBlank(address)),
        }),
      })
      const json = await res.json().catch(() => ({}))

      if (res.status === 401) {
        onLogout()
        return
      }

      if (!res.ok) {
        setAddressesNotice({
          type: 'error',
          message: json.error || 'Failed to save addresses.',
        })
        return
      }

      setShippingAddresses(buildShippingAddresses(json.addresses))
      setAddressesNotice({
        type: 'success',
        message: 'Shipping addresses saved successfully.',
      })
    } catch {
      setAddressesNotice({
        type: 'error',
        message: 'Failed to save addresses.',
      })
    } finally {
      setAddressesSaving(false)
    }
  }

  const handleSaveBilling = async () => {
    setBillingSaving(true)
    setBillingNotice(null)

    try {
      const res = await fetchWithAuth('/api/account/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingInfo),
      })
      const json = await res.json().catch(() => ({}))

      if (res.status === 401) {
        onLogout()
        return
      }

      if (!res.ok) {
        setBillingNotice({
          type: 'error',
          message: json.error || 'Failed to save billing details.',
        })
        return
      }

      setBillingInfo(buildBillingInfo(json.billing))
      setBillingNotice({
        type: 'success',
        message: 'Billing details saved successfully.',
      })
    } catch {
      setBillingNotice({
        type: 'error',
        message: 'Failed to save billing details.',
      })
    } finally {
      setBillingSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="mt-3 text-sm text-secondary-500">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-red-600">{error || 'Something went wrong'}</p>
        <button onClick={loadData} className="mt-4 text-sm text-primary-600 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  const { profile, orders, rfqs } = data
  const displayProfile = profileForm.email ? profileForm : buildEditableProfile(profile)

  return (
    <div className="mx-auto max-w-5xl">
      {/* Profile Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-secondary-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-secondary-900">
            {displayProfile.name ? `Welcome back, ${displayProfile.name}` : 'Your Account'}
          </h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary-500">
            {displayProfile.company && <span>{displayProfile.company}</span>}
            <span>{displayProfile.email}</span>
            {displayProfile.phone && <span>{displayProfile.phone}</span>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 transition hover:bg-secondary-50"
        >
          Sign Out
        </button>
      </div>

      {/* Profile */}
      <section className="mt-8 rounded-lg border border-secondary-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Profile</h2>
            <p className="mt-1 text-sm text-secondary-500">
              Keep your primary buyer contact details up to date for faster checkout and support.
            </p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-secondary-700">Full Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(event) => handleProfileChange('name', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Job Title</label>
            <input
              type="text"
              value={profileForm.title}
              onChange={(event) => handleProfileChange('title', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Procurement Manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Company</label>
            <input
              type="text"
              value={profileForm.company}
              onChange={(event) => handleProfileChange('company', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Phone</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(event) => handleProfileChange('phone', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-secondary-700">Email</label>
            <input
              type="email"
              value={profileForm.email}
              disabled
              className="mt-1 w-full rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-secondary-500"
            />
          </div>
        </div>

        <SectionNoticeMessage notice={profileNotice} />
      </section>

      {/* Shipping Addresses */}
      <section className="mt-8 rounded-lg border border-secondary-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Shipping Addresses</h2>
            <p className="mt-1 text-sm text-secondary-500">
              Save your common delivery locations now so we can use them for later checkout prefills.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddAddress}
              className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-700 transition hover:bg-secondary-50"
            >
              Add Address
            </button>
            <button
              onClick={handleSaveAddresses}
              disabled={addressesSaving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              {addressesSaving ? 'Saving...' : 'Save Addresses'}
            </button>
          </div>
        </div>

        {shippingAddresses.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-secondary-300 p-6 text-sm text-secondary-500">
            No saved shipping addresses yet. Add one to start building your lightweight account center.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {shippingAddresses.map((address, index) => (
              <div key={`shipping-address-${index}`} className="rounded-lg border border-secondary-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-secondary-900">
                    Address {index + 1}
                  </h3>
                  <button
                    onClick={() => handleRemoveAddress(index)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Label</label>
                    <input
                      type="text"
                      value={address.label}
                      onChange={(event) => handleAddressChange(index, 'label', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      placeholder="Warehouse / HQ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(event) => handleAddressChange(index, 'country', event.target.value.toUpperCase())}
                      className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      placeholder="US"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700">Street Address</label>
                    <textarea
                      rows={2}
                      value={address.address}
                      onChange={(event) => handleAddressChange(index, 'address', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      placeholder="123 Industrial Blvd, Suite 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(event) => handleAddressChange(index, 'city', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">State / Region</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(event) => handleAddressChange(index, 'state', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Postal Code</label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(event) => handleAddressChange(index, 'postalCode', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <SectionNoticeMessage notice={addressesNotice} />
      </section>

      {/* Billing / Tax */}
      <section className="mt-8 rounded-lg border border-secondary-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Billing / Tax Info</h2>
            <p className="mt-1 text-sm text-secondary-500">
              Store your invoice legal name, tax number, and billing address for faster repeat purchasing.
            </p>
          </div>
          <button
            onClick={handleSaveBilling}
            disabled={billingSaving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {billingSaving ? 'Saving...' : 'Save Billing'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-secondary-700">Legal Company Name</label>
            <input
              type="text"
              value={billingInfo.companyLegalName}
              onChange={(event) => handleBillingChange('companyLegalName', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Acme Corporation LLC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Tax ID / VAT Number</label>
            <input
              type="text"
              value={billingInfo.taxId}
              onChange={(event) => handleBillingChange('taxId', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="US EIN / VAT ID"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-secondary-700">Billing Address</label>
            <textarea
              rows={3}
              value={billingInfo.billingAddress}
              onChange={(event) => handleBillingChange('billingAddress', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Billing address for invoices"
            />
          </div>
        </div>

        <SectionNoticeMessage notice={billingNotice} />
      </section>

      {/* Order History */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-secondary-900">Order History</h2>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-secondary-300 p-8 text-center">
            <p className="text-secondary-500">No orders yet.</p>
            <Link href="/category" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline">
              Start shopping &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-secondary-200 text-xs uppercase text-secondary-500">
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Payment</th>
                  <th className="pb-3 pr-4 font-medium">Items</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/order/${order.orderNumber}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-secondary-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge label={order.status} colorClass={ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'} />
                    </td>
                    <td className="py-3 pr-4">
                      <Badge label={order.paymentStatus} colorClass={PAYMENT_STATUS_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-800'} />
                    </td>
                    <td className="py-3 pr-4 text-secondary-600">{order.itemCount}</td>
                    <td className="py-3 text-right font-medium text-secondary-900">
                      ${formatOrderTotal(order.total)} {order.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RFQ History */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-secondary-900">Quote Requests</h2>
        {rfqs.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-secondary-300 p-8 text-center">
            <p className="text-secondary-500">No quote requests yet.</p>
            <Link href="/rfq" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline">
              Request a quote &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-secondary-200 text-xs uppercase text-secondary-500">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-3 pr-4 text-secondary-600 whitespace-nowrap">
                      {new Date(rfq.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge label={rfq.status} colorClass={RFQ_STATUS_COLORS[rfq.status] || 'bg-gray-100 text-gray-800'} />
                    </td>
                    <td className="py-3 text-secondary-600">{rfq.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="mt-8 flex flex-wrap gap-3 border-t border-secondary-200 pt-6">
        <Link href="/category" className="btn-secondary text-sm">
          Browse Products
        </Link>
        <Link href="/rfq" className="btn-secondary text-sm">
          Request a Quote
        </Link>
        <Link href="/contact" className="btn-secondary text-sm">
          Contact Support
        </Link>
      </section>
    </div>
  )
}

// ─── Main Account Page ───────────────────────────────────────────────────────

export default function AccountPage() {
  const [step, setStep] = useState<'email' | 'code' | 'dashboard'>('email')
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    clearSession()

    async function checkSession() {
      try {
        const res = await fetch('/api/account/me', {
          credentials: 'same-origin',
          cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))

        if (res.ok && data.authenticated && data.email) {
          setEmail(String(data.email))
          setStep('dashboard')
        }
      } catch {
        // Ignore initial session check errors and show sign-in flow
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [])

  const handleCodeSent = (sentEmail: string) => {
    setEmail(sentEmail)
    setStep('code')
  }

  const handleVerified = () => {
    setStep('dashboard')
  }

  const handleLogout = () => {
    clearSession()
    setStep('email')
    setEmail('')
  }

  if (checking) {
    return (
      <div className="container-main flex min-h-[50vh] items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="container-main py-12">
      {step === 'email' && <EmailStep onCodeSent={handleCodeSent} />}
      {step === 'code' && (
        <CodeStep email={email} onVerified={handleVerified} onBack={() => setStep('email')} />
      )}
      {step === 'dashboard' && <Dashboard onLogout={handleLogout} />}
    </div>
  )
}
