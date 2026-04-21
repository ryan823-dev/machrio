'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
import { clearSession, fetchWithAuth } from '@/lib/account'
import { readAccountCartSnapshot, writeAccountCartSnapshot } from '@/lib/account-cart-snapshot'
import { clearCheckoutDraft } from '@/lib/checkout-draft'
import { useCart } from '@/contexts/CartContext'

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

interface SecurityState {
  hasPassword: boolean
  emailVerified: boolean
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
  authenticated?: boolean
  email?: string
  expiresAt?: string
  hasPassword?: boolean
  emailVerified?: boolean
  pendingVerification?: boolean
}

async function postAccountAction(url: string, body: Record<string, unknown>, fallbackError: string): Promise<SendCodeResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return {
      success: false,
      error: typeof data.error === 'string' ? data.error : fallbackError,
      retryAfterSeconds:
        typeof data.retryAfterSeconds === 'number' ? data.retryAfterSeconds : undefined,
    }
  }

  return {
    success: true,
    message: typeof data.message === 'string' ? data.message : undefined,
    authenticated: Boolean(data.authenticated),
    email: typeof data.email === 'string' ? data.email : undefined,
    expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : undefined,
    hasPassword: typeof data.hasPassword === 'boolean' ? data.hasPassword : undefined,
    emailVerified: typeof data.emailVerified === 'boolean' ? data.emailVerified : undefined,
    pendingVerification: Boolean(data.pendingVerification),
  }
}

async function requestVerificationCode(email: string): Promise<SendCodeResult> {
  return postAccountAction('/api/account/send-code', { email }, 'Failed to send code')
}

async function requestPasswordLogin(email: string, password: string): Promise<SendCodeResult> {
  return postAccountAction('/api/account/login', { email, password }, 'Failed to sign in')
}

async function requestRegistration(
  email: string,
  password: string,
  confirmPassword: string,
): Promise<SendCodeResult> {
  return postAccountAction(
    '/api/account/register',
    { email, password, confirmPassword },
    'Failed to create account',
  )
}

async function requestRegistrationVerification(email: string, code: string): Promise<SendCodeResult> {
  return postAccountAction(
    '/api/account/register/verify',
    { email, code },
    'Failed to verify account',
  )
}

async function requestRegistrationResend(email: string): Promise<SendCodeResult> {
  return postAccountAction(
    '/api/account/register/resend',
    { email },
    'Failed to resend verification code',
  )
}

async function requestForgotPassword(email: string): Promise<SendCodeResult> {
  return postAccountAction(
    '/api/account/password/forgot',
    { email },
    'Failed to send reset code',
  )
}

async function requestPasswordReset(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
): Promise<SendCodeResult> {
  return postAccountAction(
    '/api/account/password/reset',
    { email, code, newPassword, confirmPassword },
    'Failed to reset password',
  )
}

async function requestPasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<SendCodeResult> {
  return postAccountAction(
    '/api/account/password/change',
    { currentPassword, newPassword, confirmPassword },
    'Failed to update password',
  )
}

function buildRetryMessage(message: string, retryAfterSeconds?: number) {
  if (!retryAfterSeconds) return message
  return `${message} Try again in ${formatCooldown(retryAfterSeconds)}.`
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

// ─── Auth Steps ──────────────────────────────────────────────────────────────

function AuthShell({
  title,
  description,
  iconBgClass,
  icon,
  children,
}: {
  title: string
  description: string
  iconBgClass: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBgClass}`}>
          {icon}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
      <p className="mt-2 text-secondary-600">{description}</p>

      {children}
    </div>
  )
}

function SignInStep({
  onSignedIn,
  onUseEmailCode,
  onCreateAccount,
  onForgotPassword,
}: {
  onSignedIn: (email: string) => void
  onUseEmailCode: () => void
  onCreateAccount: () => void
  onForgotPassword: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await requestPasswordLogin(normalizedEmail, password)

      if (!result.success) {
        setError(buildRetryMessage(result.error || 'Failed to sign in', result.retryAfterSeconds))
        return
      }

      onSignedIn(normalizedEmail)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Sign In to Your Account"
      description="Use your email and password to access order history, quotes, and saved buyer details."
      iconBgClass="bg-primary-100"
      icon={(
        <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11V7a3 3 0 10-6 0v4m-2 0h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" />
        </svg>
      )}
    >
      <form onSubmit={handleSubmit} className="mt-8 text-left">
        <label htmlFor="sign-in-email" className="block text-sm font-medium text-secondary-700">
          Email Address
        </label>
        <input
          id="sign-in-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />

        <label htmlFor="sign-in-password" className="mt-4 block text-sm font-medium text-secondary-700">
          Password
        </label>
        <input
          id="sign-in-password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-sm">
        <button onClick={onForgotPassword} className="font-medium text-primary-600 hover:text-primary-800">
          Forgot your password?
        </button>
        <div className="flex flex-wrap justify-center gap-4 text-secondary-500">
          <button onClick={onUseEmailCode} className="hover:text-secondary-700">
            Use email code instead
          </button>
          <button onClick={onCreateAccount} className="hover:text-secondary-700">
            Create an account
          </button>
        </div>
      </div>
    </AuthShell>
  )
}

function EmailCodeRequestStep({
  onCodeSent,
  onBackToSignIn,
  onCreateAccount,
}: {
  onCodeSent: (email: string) => void
  onBackToSignIn: () => void
  onCreateAccount: () => void
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await requestVerificationCode(normalizedEmail)

      if (!result.success) {
        setError(buildRetryMessage(result.error || 'Failed to send code', result.retryAfterSeconds))
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
    <AuthShell
      title="Sign In with an Email Code"
      description="We will send a one-time code to your email. No password is needed."
      iconBgClass="bg-primary-100"
      icon={(
        <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      )}
    >
      <form onSubmit={handleSubmit} className="mt-8 text-left">
        <label htmlFor="email-code-email" className="block text-sm font-medium text-secondary-700">
          Email Address
        </label>
        <input
          id="email-code-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-secondary-500">
        <button onClick={onBackToSignIn} className="hover:text-secondary-700">
          Back to password sign-in
        </button>
        <button onClick={onCreateAccount} className="hover:text-secondary-700">
          Create an account
        </button>
      </div>
    </AuthShell>
  )
}

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
    const timer = setTimeout(() => setResendCooldown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      const res = await fetch('/api/account/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Verification failed')
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

        setError(buildRetryMessage(result.error || 'Failed to resend code', result.retryAfterSeconds))
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
    <AuthShell
      title="Check Your Email"
      description={`We sent a 6-digit sign-in code to ${email}.`}
      iconBgClass="bg-green-100"
      icon={(
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
    >
      <form onSubmit={handleSubmit} className="mt-8 text-left">
        <label htmlFor="email-code" className="block text-sm font-medium text-secondary-700">
          Verification Code
        </label>
        <input
          id="email-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-secondary-900 placeholder:text-secondary-300 placeholder:tracking-[0.3em] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          autoFocus
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

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
    </AuthShell>
  )
}

function CreateAccountStep({
  onRegistered,
  onBackToSignIn,
}: {
  onRegistered: (email: string) => void
  onBackToSignIn: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await requestRegistration(normalizedEmail, password, confirmPassword)

      if (!result.success) {
        setError(buildRetryMessage(result.error || 'Failed to create account', result.retryAfterSeconds))
        return
      }

      onRegistered(normalizedEmail)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create Your Account"
      description="Set a password to manage orders, quotes, saved addresses, and billing details."
      iconBgClass="bg-amber-100"
      icon={(
        <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      )}
    >
      <form onSubmit={handleSubmit} className="mt-8 text-left">
        <label htmlFor="register-email" className="block text-sm font-medium text-secondary-700">
          Email Address
        </label>
        <input
          id="register-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />

        <label htmlFor="register-password" className="mt-4 block text-sm font-medium text-secondary-700">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters, with letters and numbers"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />

        <label htmlFor="register-confirm-password" className="mt-4 block text-sm font-medium text-secondary-700">
          Confirm Password
        </label>
        <input
          id="register-confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-enter your password"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-sm text-secondary-500">
        Already have an account?{' '}
        <button onClick={onBackToSignIn} className="font-medium text-primary-600 hover:text-primary-800">
          Sign in
        </button>
      </div>
    </AuthShell>
  )
}

function RegisterVerificationStep({
  email,
  onVerified,
  onBackToRegister,
}: {
  email: string
  onVerified: () => void
  onBackToRegister: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      const result = await requestRegistrationVerification(email, code)

      if (!result.success) {
        setError(result.error || 'Verification failed')
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
    if (resending || resendCooldown > 0) return
    setError('')
    setNotice('')
    setResending(true)

    try {
      const result = await requestRegistrationResend(email)

      if (!result.success) {
        if (typeof result.retryAfterSeconds === 'number') {
          setResendCooldown(result.retryAfterSeconds)
        }

        setError(buildRetryMessage(result.error || 'Failed to resend code', result.retryAfterSeconds))
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
    <AuthShell
      title="Verify Your New Account"
      description={`Enter the 6-digit code we sent to ${email}.`}
      iconBgClass="bg-green-100"
      icon={(
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6-1a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    >
      <form onSubmit={handleSubmit} className="mt-8 text-left">
        <label htmlFor="register-code" className="block text-sm font-medium text-secondary-700">
          Verification Code
        </label>
        <input
          id="register-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-secondary-900 placeholder:text-secondary-300 placeholder:tracking-[0.3em] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          autoFocus
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify and Continue'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button onClick={onBackToRegister} className="text-secondary-500 hover:text-secondary-700">
          &larr; Back to registration
        </button>
        <button
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
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
    </AuthShell>
  )
}

function ForgotPasswordStep({
  onResetComplete,
  onBackToSignIn,
}: {
  onResetComplete: (email: string) => void
  onBackToSignIn: () => void
}) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [stage, setStage] = useState<'request' | 'reset'>('request')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleRequestCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await requestForgotPassword(normalizedEmail)

      if (!result.success) {
        setError(buildRetryMessage(result.error || 'Failed to send reset code', result.retryAfterSeconds))
        return
      }

      setEmail(normalizedEmail)
      setStage('reset')
      setNotice(result.message || 'If an account exists for this email, a reset code has been sent.')
      setResendCooldown(60)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      const result = await requestPasswordReset(email.trim().toLowerCase(), code, newPassword, confirmPassword)

      if (!result.success) {
        setError(result.error || 'Failed to reset password')
        return
      }

      onResetComplete(email.trim().toLowerCase())
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return
    setError('')
    setNotice('')
    setResending(true)

    try {
      const result = await requestForgotPassword(email.trim().toLowerCase())

      if (!result.success) {
        if (typeof result.retryAfterSeconds === 'number') {
          setResendCooldown(result.retryAfterSeconds)
        }

        setError(buildRetryMessage(result.error || 'Failed to resend reset code', result.retryAfterSeconds))
        return
      }

      setResendCooldown(60)
      setNotice(result.message || 'If an account exists for this email, a reset code has been sent.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Reset Your Password"
      description={stage === 'request'
        ? 'Enter your email and we will send you a reset code.'
        : `Enter the reset code sent to ${email} and choose a new password.`}
      iconBgClass="bg-secondary-100"
      icon={(
        <svg className="h-8 w-8 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.2-.703 2.235-1.72 2.718-.742.353-1.28 1.036-1.28 1.857V17M12 21h.01M7 11V9a5 5 0 1110 0v2" />
        </svg>
      )}
    >
      {stage === 'request' ? (
        <form onSubmit={handleRequestCode} className="mt-8 text-left">
          <label htmlFor="forgot-email" className="block text-sm font-medium text-secondary-700">
            Email Address
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {notice && <p className="mt-2 text-sm text-green-600">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="mt-8 text-left">
          <label htmlFor="reset-code" className="block text-sm font-medium text-secondary-700">
            Reset Code
          </label>
          <input
            id="reset-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-secondary-900 placeholder:text-secondary-300 placeholder:tracking-[0.3em] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />

          <label htmlFor="reset-password" className="mt-4 block text-sm font-medium text-secondary-700">
            New Password
          </label>
          <input
            id="reset-password"
            type="password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters, with letters and numbers"
            className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />

          <label htmlFor="reset-confirm-password" className="mt-4 block text-sm font-medium text-secondary-700">
            Confirm New Password
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your new password"
            className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {notice && <p className="mt-2 text-sm text-green-600">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-between text-sm">
        <button onClick={onBackToSignIn} className="text-secondary-500 hover:text-secondary-700">
          &larr; Back to sign-in
        </button>
        {stage === 'reset' ? (
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-primary-600 hover:text-primary-800 disabled:text-secondary-400"
          >
            {resending
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend in ${formatCooldown(resendCooldown)}`
                : 'Resend code'}
          </button>
        ) : null}
      </div>
    </AuthShell>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { items, selectedItems, shippingCountry, shippingMethodCode, resetCartSession } = useCart()
  const [data, setData] = useState<AccountData | null>(null)
  const [security, setSecurity] = useState<SecurityState>({
    hasPassword: false,
    emailVerified: false,
  })
  const [profileForm, setProfileForm] = useState<EditableProfile>(EMPTY_PROFILE)
  const [shippingAddresses, setShippingAddresses] = useState<ShippingAddress[]>([])
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(EMPTY_BILLING_INFO)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [addressesSaving, setAddressesSaving] = useState(false)
  const [billingSaving, setBillingSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileNotice, setProfileNotice] = useState<SectionNotice | null>(null)
  const [addressesNotice, setAddressesNotice] = useState<SectionNotice | null>(null)
  const [billingNotice, setBillingNotice] = useState<SectionNotice | null>(null)
  const [passwordNotice, setPasswordNotice] = useState<SectionNotice | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [dashboardRes, profileRes, addressesRes, billingRes, meRes] = await Promise.all([
        fetchWithAuth('/api/account/data'),
        fetchWithAuth('/api/account/profile'),
        fetchWithAuth('/api/account/addresses'),
        fetchWithAuth('/api/account/billing'),
        fetchWithAuth('/api/account/me'),
      ])

      const responses = [dashboardRes, profileRes, addressesRes, billingRes, meRes]

      if (responses.some((response) => response.status === 401)) {
        onLogout()
        return
      }

      const [dashboardJson, profileJson, addressesJson, billingJson, meJson] = await Promise.all(
        responses.map((response) => response.json().catch(() => ({}))),
      )

      if (!dashboardRes.ok || !profileRes.ok || !addressesRes.ok || !billingRes.ok || !meRes.ok) {
        setError(
          dashboardJson.error
          || profileJson.error
          || addressesJson.error
          || billingJson.error
          || meJson.error
          || 'Failed to load account data',
        )
        return
      }

      setData(dashboardJson)
      setProfileForm(buildEditableProfile(profileJson.profile || dashboardJson.profile))
      setShippingAddresses(buildShippingAddresses(addressesJson.addresses))
      setBillingInfo(buildBillingInfo(billingJson.billing))
      setSecurity({
        hasPassword: Boolean(meJson.hasPassword),
        emailVerified: Boolean(meJson.emailVerified),
      })
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

    const accountEmail = (
      profileForm.email
      || data?.profile?.email
      || ''
    ).trim().toLowerCase()

    if (accountEmail) {
      writeAccountCartSnapshot(accountEmail, {
        items,
        selectedProductIds: [...selectedItems],
        shippingCountry,
        shippingMethodCode,
      })
    }

    resetCartSession()
    clearCheckoutDraft()
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

  const handlePasswordFieldChange = (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
    value: string,
  ) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }))
    setPasswordNotice(null)
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

  const handleSavePassword = async () => {
    setPasswordSaving(true)
    setPasswordNotice(null)

    try {
      const result = await requestPasswordChange(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword,
      )

      if (!result.success) {
        setPasswordNotice({
          type: 'error',
          message: result.error || 'Failed to update password.',
        })
        return
      }

      setSecurity((current) => ({
        ...current,
        hasPassword: true,
        emailVerified: true,
      }))
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setPasswordNotice({
        type: 'success',
        message: security.hasPassword
          ? 'Password updated successfully.'
          : 'Password set successfully. You can now use it to sign in.',
      })
    } catch {
      setPasswordNotice({
        type: 'error',
        message: 'Failed to update password.',
      })
    } finally {
      setPasswordSaving(false)
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

      {/* Security */}
      <section className="mt-8 rounded-lg border border-secondary-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Security</h2>
            <p className="mt-1 text-sm text-secondary-500">
              {security.hasPassword
                ? 'Update your password here. Email code sign-in remains available as a backup option.'
                : 'Set a password so you can sign in with email and password in addition to one-time email codes.'}
            </p>
          </div>
          <button
            onClick={handleSavePassword}
            disabled={passwordSaving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {passwordSaving
              ? (security.hasPassword ? 'Updating...' : 'Saving...')
              : (security.hasPassword ? 'Update Password' : 'Set Password')}
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-sm text-secondary-600">
          <p>Email verified: <span className="font-medium text-secondary-900">{security.emailVerified ? 'Yes' : 'Pending'}</span></p>
          <p className="mt-1">Password sign-in: <span className="font-medium text-secondary-900">{security.hasPassword ? 'Enabled' : 'Not set'}</span></p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {security.hasPassword ? (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-secondary-700">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => handlePasswordFieldChange('currentPassword', event.target.value)}
                className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="Enter your current password"
              />
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-secondary-700">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => handlePasswordFieldChange('newPassword', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="At least 8 characters, with letters and numbers"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => handlePasswordFieldChange('confirmPassword', event.target.value)}
              className="mt-1 w-full rounded-lg border border-secondary-300 px-4 py-3 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="Re-enter your new password"
            />
          </div>
        </div>

        <SectionNoticeMessage notice={passwordNotice} />
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
  const { restoreCartSession } = useCart()
  const [step, setStep] = useState<
    'sign-in'
    | 'email-code'
    | 'code'
    | 'register'
    | 'verify-register'
    | 'forgot-password'
    | 'dashboard'
  >('sign-in')
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
          const authenticatedEmail = String(data.email).trim().toLowerCase()
          const snapshot = readAccountCartSnapshot(authenticatedEmail)
          if (snapshot) {
            restoreCartSession(snapshot)
          }

          setEmail(authenticatedEmail)
          setStep('dashboard')
        }
      } catch {
        // Ignore initial session check errors and show sign-in flow
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [restoreCartSession])

  const handleCodeSent = (sentEmail: string) => {
    setEmail(sentEmail)
    setStep('code')
  }

  const handleAuthenticated = (nextEmail?: string) => {
    const authenticatedEmail = (nextEmail || email).trim().toLowerCase()

    if (authenticatedEmail) {
      const snapshot = readAccountCartSnapshot(authenticatedEmail)
      if (snapshot) {
        restoreCartSession(snapshot)
      }
    }

    if (authenticatedEmail) {
      setEmail(authenticatedEmail)
    } else if (nextEmail) {
      setEmail(nextEmail)
    }
    setStep('dashboard')
  }

  const handleLogout = () => {
    clearSession()
    setStep('sign-in')
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
      {step === 'sign-in' && (
        <SignInStep
          onSignedIn={handleAuthenticated}
          onUseEmailCode={() => setStep('email-code')}
          onCreateAccount={() => setStep('register')}
          onForgotPassword={() => setStep('forgot-password')}
        />
      )}
      {step === 'email-code' && (
        <EmailCodeRequestStep
          onCodeSent={handleCodeSent}
          onBackToSignIn={() => setStep('sign-in')}
          onCreateAccount={() => setStep('register')}
        />
      )}
      {step === 'code' && (
        <CodeStep email={email} onVerified={() => handleAuthenticated()} onBack={() => setStep('email-code')} />
      )}
      {step === 'register' && (
        <CreateAccountStep
          onRegistered={(registeredEmail) => {
            setEmail(registeredEmail)
            setStep('verify-register')
          }}
          onBackToSignIn={() => setStep('sign-in')}
        />
      )}
      {step === 'verify-register' && (
        <RegisterVerificationStep
          email={email}
          onVerified={() => handleAuthenticated()}
          onBackToRegister={() => setStep('register')}
        />
      )}
      {step === 'forgot-password' && (
        <ForgotPasswordStep
          onResetComplete={handleAuthenticated}
          onBackToSignIn={() => setStep('sign-in')}
        />
      )}
      {step === 'dashboard' && <Dashboard onLogout={handleLogout} />}
    </div>
  )
}
