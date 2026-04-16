'use client'

import { useEffect, useState } from 'react'
import { clearSession, fetchWithAuth, getSession, setSession } from '@/lib/account'
import { PartnerCodeStep, PartnerEmailStep } from './PartnerAuthPanels'

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function toNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function statusClass(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'approved':
    case 'active':
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'pending':
    case 'submitted':
    case 'under-review':
    case 'locked':
      return 'bg-amber-100 text-amber-800'
    case 'paused':
      return 'bg-blue-100 text-blue-800'
    case 'rejected':
    case 'reversed':
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-secondary-100 text-secondary-700'
  }
}

function getDownloadFilename(headerValue: string | null, fallback: string) {
  if (!headerValue) return fallback

  const encodedMatch = headerValue.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      return encodedMatch[1]
    }
  }

  const plainMatch = headerValue.match(/filename="?([^"]+)"?/i)
  return plainMatch?.[1] || fallback
}

export function PartnerAdminDashboard() {
  const [step, setStep] = useState<'email' | 'code' | 'dashboard'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [feeInputs, setFeeInputs] = useState<Record<string, string>>({})
  const [payoutRefInputs, setPayoutRefInputs] = useState<Record<string, string>>({})
  const [data, setData] = useState<{
    summary: Record<string, string | number | null>
    pendingApplications: Array<Record<string, string | number | null>>
    publicationsToReview: Array<Record<string, string | number | null>>
    topPublications: Array<Record<string, string | number | null>>
    topPartners: Array<Record<string, string | number | null>>
    payoutCandidates: Array<Record<string, string | number | null>>
    payouts: Array<Record<string, string | number | null>>
  } | null>(null)

  const loadOverview = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchWithAuth('/api/partner/admin/overview')
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          clearSession()
          setStep('email')
        }
        setError(payload.error || 'Failed to load partner admin overview.')
        setData(null)
        return
      }

      setData(payload)
      setStep('dashboard')

      const initialFeeInputs: Record<string, string> = {}
      for (const row of payload.publicationsToReview || []) {
        initialFeeInputs[String(row.id)] = String(row.fee_amount ?? '20')
      }
      setFeeInputs((current) => ({ ...initialFeeInputs, ...current }))
    } catch {
      setError('Network error. Please try again.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const session = getSession()
    if (session?.isValid) {
      setEmail(session.email)
      void loadOverview()
      return
    }

    setLoading(false)
  }, [])

  const handlePartnerAction = async (
    partnerId: string,
    status: 'approved' | 'rejected' | 'paused' | 'active',
  ) => {
    setBusyKey(`partner:${partnerId}:${status}`)
    setError('')
    setActionMessage('')

    try {
      const response = await fetchWithAuth(`/api/partner/admin/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error || 'Failed to update partner status.')
        return
      }

      setActionMessage(`Partner status updated to ${status}.`)
      await loadOverview()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusyKey('')
    }
  }

  const handlePublicationAction = async (
    publicationId: string,
    reviewStatus: 'under-review' | 'approved' | 'rejected',
  ) => {
    setBusyKey(`publication:${publicationId}:${reviewStatus}`)
    setError('')
    setActionMessage('')

    try {
      const feeAmountValue = Number(feeInputs[publicationId] || '0')
      const response = await fetchWithAuth(
        `/api/partner/admin/publications/${publicationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewStatus,
            feeAmount: Number.isFinite(feeAmountValue) ? feeAmountValue : 0,
          }),
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error || 'Failed to update publication.')
        return
      }

      setActionMessage(`Publication moved to ${reviewStatus}.`)
      await loadOverview()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusyKey('')
    }
  }

  const handleCreatePayout = async (partnerId: string, currency: string) => {
    setBusyKey(`payout:create:${partnerId}:${currency}`)
    setError('')
    setActionMessage('')

    try {
      const response = await fetchWithAuth('/api/partner/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, currency }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error || 'Failed to create payout batch.')
        return
      }

      setActionMessage(
        `Payout batch ${payload.payout.payoutNumber} created for ${payload.payout.currency}.`,
      )
      await loadOverview()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusyKey('')
    }
  }

  const handlePayoutStatus = async (
    payoutId: string,
    status: 'paid' | 'cancelled',
  ) => {
    setBusyKey(`payout:${payoutId}:${status}`)
    setError('')
    setActionMessage('')

    try {
      const response = await fetchWithAuth(`/api/partner/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          transactionRef: payoutRefInputs[payoutId] || '',
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error || 'Failed to update payout batch.')
        return
      }

      setActionMessage(
        status === 'paid'
          ? 'Payout batch marked as paid.'
          : 'Payout batch cancelled and items unlocked.',
      )
      await loadOverview()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusyKey('')
    }
  }

  const handleExportPayout = async (payoutId: string) => {
    setBusyKey(`payout:export:${payoutId}`)
    setError('')
    setActionMessage('')

    try {
      const response = await fetchWithAuth(
        `/api/partner/admin/payouts/${payoutId}?format=csv`,
      )

      if (!response.ok) {
        if (response.status === 401) {
          clearSession()
          setStep('email')
          setData(null)
        }

        const payload = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        setError(payload.error || 'Failed to export payout batch.')
        return
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = getDownloadFilename(
        response.headers.get('content-disposition'),
        `partner-payout-${payoutId}.csv`,
      )

      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      setActionMessage(`Payout export downloaded: ${filename}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusyKey('')
    }
  }

  if (loading) {
    return (
      <div className="container-main py-16">
        <div className="rounded-2xl border border-secondary-200 bg-white p-8 text-secondary-600 shadow-sm">
          Loading partner admin overview...
        </div>
      </div>
    )
  }

  if (step === 'email') {
    return (
      <div className="container-main py-16">
        <PartnerEmailStep
          title="Partner Admin Access"
          description="Sign in with an approved Machrio admin email to review partner applications and manage creator payouts."
          submitLabel="Send admin code"
          onCodeSent={(nextEmail) => {
            setEmail(nextEmail)
            setStep('code')
          }}
        />
        {error && <p className="mx-auto mt-4 max-w-md text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (step === 'code') {
    return (
      <div className="container-main py-16">
        <PartnerCodeStep
          email={email}
          title="Verify Admin Access"
          onBack={() => {
            setStep('email')
            setError('')
          }}
          onVerified={(token, expiresAt) => {
            setSession(token, email, expiresAt)
            void loadOverview()
          }}
        />
        {error && <p className="mx-auto mt-4 max-w-md text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-main py-16">
        <div className="rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-secondary-900">Admin Access Required</h1>
          <p className="mt-3 text-secondary-600">
            This page is only available to allowed partner program admins.
          </p>
          <button
            type="button"
            onClick={() => {
              clearSession()
              setStep('email')
            }}
            className="btn-secondary mt-6 rounded-xl px-5 py-3"
          >
            Sign in with another email
          </button>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="container-main py-10">
      <section className="rounded-3xl bg-secondary-900 px-8 py-10 text-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Internal Overview</p>
            <h1 className="mt-3 text-3xl font-bold">Partner Program Admin</h1>
            <p className="mt-3 max-w-2xl text-secondary-200">
              Review creator applications, approve publications, and lock approved fees and commissions into payout batches.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession()
              setStep('email')
              setData(null)
            }}
            className="font-medium text-amber-300 hover:text-amber-200"
          >
            Sign out
          </button>
        </div>
      </section>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {actionMessage && <p className="mt-6 text-sm text-green-700">{actionMessage}</p>}

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Partners', value: toNumber(data.summary.total_partners) },
          { label: 'Pending Review', value: toNumber(data.summary.pending_partners) },
          { label: 'Publications Queue', value: toNumber(data.summary.publications_to_review) },
          { label: 'Partner Orders', value: toNumber(data.summary.partner_orders) },
          {
            label: 'Partner Sales',
            value: formatMoney(toNumber(data.summary.partner_sales)),
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-secondary-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Approved Fees Ready</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.approved_fees_ready))}
          </p>
        </div>
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Approved Commission Ready</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.approved_commissions_ready))}
          </p>
        </div>
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Paid Out Total</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.paid_out_total))}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary-900">Partner Review Queue</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Partner</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.pendingApplications.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={6}>
                    No partner applications yet.
                  </td>
                </tr>
              ) : (
                data.pendingApplications.map((item) => {
                  const partnerId = String(item.id)
                  const partnerStatus = String(item.status)
                  return (
                    <tr key={partnerId} className="border-b border-secondary-100 align-top">
                      <td className="py-4 font-medium text-secondary-900">{String(item.full_name)}</td>
                      <td className="py-4 text-secondary-700">{String(item.email)}</td>
                      <td className="py-4 text-secondary-700">{String(item.partner_code)}</td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(partnerStatus)}`}>
                          {partnerStatus}
                        </span>
                      </td>
                      <td className="py-4 text-secondary-600">
                        {item.created_at
                          ? new Date(String(item.created_at)).toLocaleDateString('en-US')
                          : '-'}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyKey === `partner:${partnerId}:approved`}
                            onClick={() => void handlePartnerAction(partnerId, 'approved')}
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `partner:${partnerId}:paused`}
                            onClick={() => void handlePartnerAction(partnerId, 'paused')}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-200 disabled:opacity-60"
                          >
                            Pause
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `partner:${partnerId}:rejected`}
                            onClick={() => void handlePartnerAction(partnerId, 'rejected')}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
                          >
                            Reject
                          </button>
                          {partnerStatus === 'paused' && (
                            <button
                              type="button"
                              disabled={busyKey === `partner:${partnerId}:active`}
                              onClick={() => void handlePartnerAction(partnerId, 'active')}
                              className="rounded-lg bg-secondary-100 px-3 py-1.5 text-xs font-medium text-secondary-700 hover:bg-secondary-200 disabled:opacity-60"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary-900">Publication Review Queue</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Publication</th>
                <th className="pb-3 font-medium">Partner</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Clicks</th>
                <th className="pb-3 font-medium">Sales</th>
                <th className="pb-3 font-medium">Fee</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.publicationsToReview.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={7}>
                    No publications waiting for review.
                  </td>
                </tr>
              ) : (
                data.publicationsToReview.map((item) => {
                  const publicationId = String(item.id)
                  const reviewStatus = String(item.review_status)
                  return (
                    <tr key={publicationId} className="border-b border-secondary-100 align-top">
                      <td className="py-4">
                        <a
                          href={String(item.published_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-secondary-900 hover:text-primary-700"
                        >
                          {String(item.title)}
                        </a>
                        <div className="mt-1 text-xs text-secondary-500">
                          {String(item.platform)} · {String(item.content_type)}
                        </div>
                      </td>
                      <td className="py-4 text-secondary-700">
                        {String(item.partner_name)}
                        <div className="mt-1 text-xs text-secondary-500">{String(item.email)}</div>
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(reviewStatus)}`}>
                          {reviewStatus}
                        </span>
                      </td>
                      <td className="py-4 text-secondary-900">{toNumber(item.click_count)}</td>
                      <td className="py-4 text-secondary-900">
                        {formatMoney(toNumber(item.sales_amount))}
                      </td>
                      <td className="py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={feeInputs[publicationId] ?? String(item.fee_amount ?? '20')}
                          onChange={(event) =>
                            setFeeInputs((current) => ({
                              ...current,
                              [publicationId]: event.target.value,
                            }))
                          }
                          className="w-24 rounded-lg border border-secondary-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyKey === `publication:${publicationId}:under-review`}
                            onClick={() =>
                              void handlePublicationAction(publicationId, 'under-review')
                            }
                            className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-60"
                          >
                            Under Review
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `publication:${publicationId}:approved`}
                            onClick={() =>
                              void handlePublicationAction(publicationId, 'approved')
                            }
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyKey === `publication:${publicationId}:rejected`}
                            onClick={() =>
                              void handlePublicationAction(publicationId, 'rejected')
                            }
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary-900">Payout Candidates</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Partner</th>
                <th className="pb-3 font-medium">Currency</th>
                <th className="pb-3 font-medium">Content Fees</th>
                <th className="pb-3 font-medium">Commissions</th>
                <th className="pb-3 font-medium">Eligible Total</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.payoutCandidates.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={6}>
                    No approved payout items are ready yet.
                  </td>
                </tr>
              ) : (
                data.payoutCandidates.map((item) => {
                  const partnerId = String(item.partner_id)
                  const currency = String(item.currency || 'USD')
                  const busy = busyKey === `payout:create:${partnerId}:${currency}`

                  return (
                    <tr key={`${partnerId}:${currency}`} className="border-b border-secondary-100">
                      <td className="py-4 text-secondary-900">
                        {String(item.full_name)}
                        <div className="mt-1 text-xs text-secondary-500">
                          {String(item.partner_code)} · {String(item.payout_method || 'No payout method')}
                        </div>
                      </td>
                      <td className="py-4 text-secondary-700">{currency}</td>
                      <td className="py-4 text-secondary-900">
                        {toNumber(item.fee_count)} items · {formatMoney(toNumber(item.fee_total), currency)}
                      </td>
                      <td className="py-4 text-secondary-900">
                        {toNumber(item.commission_count)} items · {formatMoney(toNumber(item.commission_total), currency)}
                      </td>
                      <td className="py-4 font-medium text-secondary-900">
                        {formatMoney(toNumber(item.total_due), currency)}
                      </td>
                      <td className="py-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleCreatePayout(partnerId, currency)}
                          className="btn-accent rounded-xl px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? 'Creating...' : 'Create Batch'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary-900">Payout Ledger</h2>
        <p className="mt-2 text-sm text-secondary-600">
          Export each batch as CSV for payout execution and finance reconciliation.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Batch</th>
                <th className="pb-3 font-medium">Partner</th>
                <th className="pb-3 font-medium">Totals</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Transaction Ref</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.payouts.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={6}>
                    No payout batches yet.
                  </td>
                </tr>
              ) : (
                data.payouts.map((item) => {
                  const payoutId = String(item.id)
                  const payoutStatus = String(item.status)
                  const currency = String(item.currency || 'USD')
                  const exportBusy = busyKey === `payout:export:${payoutId}`
                  return (
                    <tr key={payoutId} className="border-b border-secondary-100 align-top">
                      <td className="py-4 text-secondary-900">
                        {String(item.payout_number)}
                        <div className="mt-1 text-xs text-secondary-500">
                          {item.created_at
                            ? new Date(String(item.created_at)).toLocaleDateString('en-US')
                            : '-'}
                        </div>
                      </td>
                      <td className="py-4 text-secondary-900">
                        {String(item.full_name)}
                        <div className="mt-1 text-xs text-secondary-500">{String(item.partner_code)}</div>
                      </td>
                      <td className="py-4 text-secondary-700">
                        <div>Total: {formatMoney(toNumber(item.total_amount), currency)}</div>
                        <div className="mt-1 text-xs text-secondary-500">
                          Fees {formatMoney(toNumber(item.content_fee_total), currency)} + Commission {formatMoney(toNumber(item.commission_total), currency)}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(payoutStatus)}`}>
                          {payoutStatus}
                        </span>
                      </td>
                      <td className="py-4">
                        <input
                          type="text"
                          value={payoutRefInputs[payoutId] ?? String(item.transaction_ref || '')}
                          onChange={(event) =>
                            setPayoutRefInputs((current) => ({
                              ...current,
                              [payoutId]: event.target.value,
                            }))
                          }
                          placeholder="Wire ref / PayPal txn"
                          className="w-44 rounded-lg border border-secondary-300 px-3 py-2 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={exportBusy}
                            onClick={() => void handleExportPayout(payoutId)}
                            className="rounded-lg bg-secondary-100 px-3 py-1.5 text-xs font-medium text-secondary-700 hover:bg-secondary-200 disabled:opacity-60"
                          >
                            {exportBusy ? 'Exporting...' : 'Export CSV'}
                          </button>
                          {payoutStatus === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={busyKey === `payout:${payoutId}:paid`}
                                onClick={() => void handlePayoutStatus(payoutId, 'paid')}
                                className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200 disabled:opacity-60"
                              >
                                Mark Paid
                              </button>
                              <button
                                type="button"
                                disabled={busyKey === `payout:${payoutId}:cancelled`}
                                onClick={() => void handlePayoutStatus(payoutId, 'cancelled')}
                                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {payoutStatus === 'paid' && item.paid_at && (
                            <span className="text-xs text-secondary-500">
                              Paid {new Date(String(item.paid_at)).toLocaleDateString('en-US')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-secondary-900">Top Publications</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-secondary-200 text-secondary-500">
                <tr>
                  <th className="pb-3 font-medium">Publication</th>
                  <th className="pb-3 font-medium">Partner</th>
                  <th className="pb-3 font-medium">Clicks</th>
                  <th className="pb-3 font-medium">Sales</th>
                </tr>
              </thead>
              <tbody>
                {data.topPublications.map((item) => (
                  <tr key={String(item.id)} className="border-b border-secondary-100">
                    <td className="py-4 text-secondary-900">{String(item.title)}</td>
                    <td className="py-4 text-secondary-700">{String(item.partner_name)}</td>
                    <td className="py-4 text-secondary-900">{toNumber(item.click_count)}</td>
                    <td className="py-4 text-secondary-900">
                      {formatMoney(toNumber(item.sales_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-secondary-900">Top Partners</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-secondary-200 text-secondary-500">
                <tr>
                  <th className="pb-3 font-medium">Partner</th>
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Sales</th>
                </tr>
              </thead>
              <tbody>
                {data.topPartners.map((item) => (
                  <tr key={String(item.id)} className="border-b border-secondary-100">
                    <td className="py-4 text-secondary-900">{String(item.full_name)}</td>
                    <td className="py-4 text-secondary-700">{String(item.partner_code)}</td>
                    <td className="py-4 text-secondary-900">{toNumber(item.order_count)}</td>
                    <td className="py-4 text-secondary-900">
                      {formatMoney(toNumber(item.sales_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
