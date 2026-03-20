'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
// 完全静态生成，构建时生成 HTML
export const dynamic = 'force-static'
import { getSession, setSession, clearSession, fetchWithAuth } from '@/lib/account'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  name: string
  company: string
  phone: string
  email: string
}

interface OrderSummary {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
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
      const res = await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send code')
        return
      }

      onCodeSent(email.trim().toLowerCase())
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
  onVerified: (token: string, expiresAt: string) => void
  onBack: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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

      onVerified(data.token, data.expiresAt)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setResendCooldown(60)

    try {
      await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Silently fail - user can try again
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
          disabled={resendCooldown > 0}
          className="text-primary-600 hover:text-primary-800 disabled:text-secondary-400"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/account/data')
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          onLogout()
          return
        }
        setError(json.error || 'Failed to load data')
        return
      }

      setData(json)
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

  return (
    <div className="mx-auto max-w-4xl">
      {/* Profile Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-secondary-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-secondary-900">
            {profile.name ? `Welcome back, ${profile.name}` : 'Your Account'}
          </h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary-500">
            {profile.company && <span>{profile.company}</span>}
            <span>{profile.email}</span>
            {profile.phone && <span>{profile.phone}</span>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-secondary-300 px-4 py-2 text-sm font-medium text-secondary-600 transition hover:bg-secondary-50"
        >
          Sign Out
        </button>
      </div>

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
                      ${order.total.toFixed(2)} {order.currency}
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

  // Check for existing session on mount
  useEffect(() => {
    const session = getSession()
    if (session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(session.email)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep('dashboard')
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(false)
  }, [])

  const handleCodeSent = (sentEmail: string) => {
    setEmail(sentEmail)
    setStep('code')
  }

  const handleVerified = (token: string, expiresAt: string) => {
    setSession(token, email, expiresAt)
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
