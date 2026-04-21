'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

interface FindOrderAccessFormProps {
  initialOrderNumber?: string
}

type AccessRequestMode = 'direct' | 'email'

interface RequestAccessResponse {
  success?: boolean
  message?: string
  error?: string
  retryAfterSeconds?: number
  orderPath?: string
  orderUrl?: string
}

function formatCooldown(seconds: number) {
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`
}

export function FindOrderAccessForm({ initialOrderNumber = '' }: FindOrderAccessFormProps) {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [email, setEmail] = useState('')
  const [submittingMode, setSubmittingMode] = useState<AccessRequestMode | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const submitting = submittingMode !== null

  async function submitRequest(mode: AccessRequestMode) {
    setSubmittingMode(mode)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/orders/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          email,
          mode,
        }),
      })

      const data = await response.json().catch(() => ({})) as RequestAccessResponse
      if (!response.ok) {
        const retryHint = typeof data.retryAfterSeconds === 'number'
          ? ` Try again in ${formatCooldown(data.retryAfterSeconds)}.`
          : ''

        throw new Error((data.error || 'Failed to request access link.') + retryHint)
      }

      if (mode === 'direct' && (data.orderPath || data.orderUrl)) {
        const nextPath = data.orderPath || data.orderUrl

        if (nextPath) {
          router.push(nextPath)
          return
        }
      }

      setSuccessMessage(
        data.message || 'If the order number and email match, we have sent a secure access link.',
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to request access link.')
    } finally {
      setSubmittingMode(null)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitRequest('direct')
  }

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-secondary-900">Find Your Order</h2>
      <p className="mt-3 text-sm leading-6 text-secondary-600">
        Enter your order number and the purchasing email address. You can open the protected order page right away, or send a secure access link to that inbox and reopen it later.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-secondary-700">Order Number</span>
          <input
            type="text"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value.toUpperCase())}
            className="input-field mt-1 w-full"
            placeholder="e.g. MCH-MO76NOJ2-10J0"
            autoCapitalize="characters"
            autoCorrect="off"
            disabled={submitting}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-secondary-700">Purchasing Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field mt-1 w-full"
            placeholder="The email used when placing the order"
            autoCapitalize="off"
            autoCorrect="off"
            disabled={submitting}
            required
          />
        </label>

        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submittingMode === 'direct' ? 'Opening Order...' : 'Open Order Now'}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submitRequest('email')}
          className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submittingMode === 'email' ? 'Sending Link...' : 'Email Secure Order Link'}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <h3 className="text-sm font-semibold text-primary-900">Tips</h3>
        <ul className="mt-2 space-y-1 text-sm text-primary-800">
          <li>Use the same email address that received the order confirmation.</li>
          <li>Open Order Now will take you straight to the protected order page when the details match.</li>
          <li>The email option is still available if you want the secure link in your inbox.</li>
          <li>For bank transfer orders, you can submit payment details from that page after sending the transfer.</li>
        </ul>
      </div>
    </div>
  )
}
