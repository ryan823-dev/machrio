'use client'

import { useEffect, useState } from 'react'

export function PartnerEmailStep({
  title,
  description,
  submitLabel,
  onCodeSent,
}: {
  title: string
  description: string
  submitLabel: string
  onCodeSent: (email: string) => void
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
      const response = await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code.')
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
    <div className="mx-auto max-w-md rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
      <p className="mt-2 text-secondary-600">{description}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="partner-email" className="block text-sm font-medium text-secondary-700">
            Email address
          </label>
          <input
            id="partner-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 text-secondary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-accent w-full justify-center rounded-xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Sending code...' : submitLabel}
        </button>
      </form>

      <p className="mt-4 text-xs text-secondary-500">
        We use a 6-digit verification code. No password needed.
      </p>
    </div>
  )
}

export function PartnerCodeStep({
  email,
  title,
  onBack,
  onVerified,
}: {
  email: string
  title: string
  onBack: () => void
  onVerified: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/account/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed.')
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
    if (cooldown > 0) return
    setCooldown(60)

    try {
      await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Ignore resend errors to keep the flow simple.
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l9 6 9-6m-18 8h18" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-secondary-900">{title}</h2>
      <p className="mt-2 text-secondary-600">
        Enter the 6-digit code sent to <span className="font-medium text-secondary-800">{email}</span>.
      </p>

      <form onSubmit={handleVerify} className="mt-8 space-y-4">
        <div>
          <label htmlFor="partner-code" className="block text-sm font-medium text-secondary-700">
            Verification code
          </label>
          <input
            id="partner-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder="123456"
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.25em] text-secondary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="btn-accent w-full justify-center rounded-xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Verifying...' : 'Verify and Continue'}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-secondary-600 hover:text-secondary-900"
        >
          Use another email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="font-medium text-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:text-secondary-400"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  )
}
