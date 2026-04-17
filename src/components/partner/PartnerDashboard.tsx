'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  clearSession,
  fetchWithAuth,
} from '@/lib/account'
import { PartnerCodeStep, PartnerEmailStep } from './PartnerAuthPanels'

interface PartnerDashboardResponse {
  partner: {
    name: string
    email: string
    website: string | null
    country: string | null
    status: string
    partnerCode: string
    mainPlatform: string | null
    expertise: string[]
    payoutMethod: string | null
  }
  summary: Record<string, string | number | null>
  links: Array<Record<string, string | number | null>>
  publications: Array<Record<string, string | number | null>>
  commissions: Array<Record<string, string | number | null>>
  payouts: Array<Record<string, string | number | null>>
}

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
      return 'bg-green-100 text-green-800'
    case 'pending':
    case 'submitted':
      return 'bg-amber-100 text-amber-800'
    case 'rejected':
    case 'reversed':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-secondary-100 text-secondary-700'
  }
}

function canOperate(status?: string) {
  return ['approved', 'active'].includes((status || '').toLowerCase())
}

export function PartnerDashboard() {
  const [step, setStep] = useState<'email' | 'code' | 'dashboard'>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<PartnerDashboardResponse | null>(null)
  const [linkForm, setLinkForm] = useState({
    title: '',
    targetUrl: '',
    targetType: 'product',
  })
  const [publicationForm, setPublicationForm] = useState({
    title: '',
    platform: 'Website / Blog',
    contentType: 'article',
    publishedUrl: '',
    trackingLinkId: '',
    publishedAt: '',
  })
  const [submittingLink, setSubmittingLink] = useState(false)
  const [submittingPublication, setSubmittingPublication] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchWithAuth('/api/partner/data')
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          clearSession()
          setStep('email')
          setError('Session expired. Please sign in again.')
          return
        }

        setError(payload.error || 'Failed to load partner dashboard.')
        setData(null)
        return
      }

      setData(payload)
      setStep('dashboard')
      setPublicationForm((current) => ({
        ...current,
        trackingLinkId:
          current.trackingLinkId ||
          String(payload.links?.[0]?.id || ''),
      }))
    } catch {
      setError('Network error. Please try again.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    clearSession()

    async function checkSession() {
      try {
        const response = await fetch('/api/account/me', {
          credentials: 'same-origin',
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => ({}))

        if (response.ok && payload.authenticated && payload.email) {
          setEmail(String(payload.email))
          await loadDashboard()
          return
        }
      } catch {
        // Show sign-in UI when the session check fails
      }

      setLoading(false)
    }

    void checkSession()
  }, [])

  const handleVerified = () => {
    void loadDashboard()
  }

  const handleCreateLink = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmittingLink(true)
    setActionMessage('')
    setError('')

    try {
      const response = await fetchWithAuth('/api/partner/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkForm),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error || 'Failed to create tracking link.')
        return
      }

      setLinkForm({ title: '', targetUrl: '', targetType: 'product' })
      setActionMessage(`Tracking link created: ${payload.link.shortUrl}`)
      await loadDashboard()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmittingLink(false)
    }
  }

  const handleSubmitPublication = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmittingPublication(true)
    setActionMessage('')
    setError('')

    try {
      const response = await fetchWithAuth('/api/partner/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publicationForm),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error || 'Failed to submit publication.')
        return
      }

      setPublicationForm((current) => ({
        ...current,
        title: '',
        publishedUrl: '',
        publishedAt: '',
      }))
      setActionMessage('Publication submitted for review.')
      await loadDashboard()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmittingPublication(false)
    }
  }

  if (loading) {
    return (
      <div className="container-main py-16">
        <div className="rounded-2xl border border-secondary-200 bg-white p-8 text-secondary-600 shadow-sm">
          Loading partner dashboard...
        </div>
      </div>
    )
  }

  if (step === 'email') {
    return (
      <div className="container-main py-16">
        <PartnerEmailStep
          title="Sign In to Partner Dashboard"
          description="Use the email you applied with to manage your partner profile, links, publications, and earnings."
          submitLabel="Send verification code"
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
          title="Verify Your Partner Access"
          onBack={() => {
            setStep('email')
            setError('')
          }}
          onVerified={handleVerified}
        />
        {error && <p className="mx-auto mt-4 max-w-md text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container-main py-16">
        <div className="max-w-2xl rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-secondary-900">Partner Profile Not Found</h1>
          <p className="mt-3 text-secondary-600">
            This email does not have a partner profile yet, or your application has not been saved.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/partner-program/apply" className="btn-accent rounded-xl px-5 py-3">
              Apply Now
            </Link>
            <button
              type="button"
              onClick={() => {
                clearSession()
                setStep('email')
              }}
              className="btn-secondary rounded-xl px-5 py-3"
            >
              Try Another Email
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    )
  }

  const approved = canOperate(data.partner.status)

  return (
    <div className="container-main py-10">
      <section className="rounded-3xl bg-secondary-900 px-8 py-10 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Machrio Creator & Partner Platform</p>
            <h1 className="mt-3 text-3xl font-bold">{data.partner.name}</h1>
            <p className="mt-3 max-w-2xl text-secondary-200">
              Track every publication, link click, RFQ, order, sales amount, and commission from your external channels in one dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className={`rounded-full px-3 py-1 font-medium ${statusClass(data.partner.status)}`}>
                {data.partner.status}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-secondary-100">
                Partner code: {data.partner.partnerCode}
              </span>
              {data.partner.mainPlatform && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-secondary-100">
                  {data.partner.mainPlatform}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 text-sm text-secondary-100">
            <p className="text-xs uppercase tracking-[0.2em] text-secondary-300">Payout</p>
            <p className="mt-2 font-semibold text-white">{data.partner.payoutMethod || 'Not set'}</p>
            <button
              type="button"
              onClick={() => {
                clearSession()
                setStep('email')
                setData(null)
              }}
              className="mt-5 text-sm font-medium text-amber-300 hover:text-amber-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {!approved && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">Review in Progress</h2>
          <p className="mt-2 text-sm">
            Your application is saved, but link generation and publication submission stay locked until your partner status becomes approved. You can still sign in here anytime to check status.
          </p>
        </section>
      )}

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {actionMessage && <p className="mt-6 text-sm text-green-700">{actionMessage}</p>}

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Tracking Links', value: toNumber(data.summary.link_count) },
          { label: 'Publications', value: toNumber(data.summary.publication_count) },
          { label: 'Clicks', value: toNumber(data.summary.click_count) },
          { label: 'Orders', value: toNumber(data.summary.order_count) },
          {
            label: 'Sales',
            value: formatMoney(toNumber(data.summary.sales_amount)),
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
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Estimated Commission</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.estimated_commission))}
          </p>
        </div>
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Pending Commission</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.pending_commission))}
          </p>
        </div>
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Content Fees</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.content_fees))}
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Approved to Payout</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(
              toNumber(data.summary.approved_content_fees) +
                toNumber(data.summary.approved_commission),
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Pending Payout Batch</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.pending_payout_total))}
          </p>
        </div>
        <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Paid Out</p>
          <p className="mt-3 text-2xl font-bold text-secondary-900">
            {formatMoney(toNumber(data.summary.paid_out_total))}
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleCreateLink} className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-secondary-900">Create Tracking Link</h2>
          <p className="mt-2 text-sm text-secondary-600">
            Generate a dedicated `/go/...` link for a product, category, brand, or RFQ page before publishing.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700">Link label</label>
              <input
                required
                disabled={!approved}
                value={linkForm.title}
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="LinkedIn post - NEMA 23 drivers"
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Machrio destination URL</label>
              <input
                required
                disabled={!approved}
                value={linkForm.targetUrl}
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, targetUrl: event.target.value }))
                }
                placeholder="https://www.machrio.com/product/..."
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Destination type</label>
              <select
                disabled={!approved}
                value={linkForm.targetType}
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, targetType: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              >
                <option value="product">Product</option>
                <option value="category">Category</option>
                <option value="brand">Brand</option>
                <option value="rfq">RFQ</option>
                <option value="topic">Topic page</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={!approved || submittingLink}
            className="btn-accent mt-6 rounded-xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingLink ? 'Creating...' : 'Create Link'}
          </button>
        </form>

        <form onSubmit={handleSubmitPublication} className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-secondary-900">Submit a Publication</h2>
          <p className="mt-2 text-sm text-secondary-600">
            Register the article, video, or post that uses your tracking link so Machrio can review it and attribute performance at the publication level.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700">Title</label>
              <input
                required
                disabled={!approved}
                value={publicationForm.title}
                onChange={(event) =>
                  setPublicationForm((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Platform</label>
              <select
                disabled={!approved}
                value={publicationForm.platform}
                onChange={(event) =>
                  setPublicationForm((current) => ({ ...current, platform: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              >
                <option value="Website / Blog">Website / Blog</option>
                <option value="YouTube">YouTube</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Newsletter">Newsletter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Content type</label>
              <select
                disabled={!approved}
                value={publicationForm.contentType}
                onChange={(event) =>
                  setPublicationForm((current) => ({ ...current, contentType: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              >
                <option value="article">Article / Blog Post</option>
                <option value="video">Video</option>
                <option value="social-post">Social Post / Thread</option>
                <option value="landing-page">Landing / Resource Page</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700">Published URL</label>
              <input
                required
                disabled={!approved}
                value={publicationForm.publishedUrl}
                onChange={(event) =>
                  setPublicationForm((current) => ({ ...current, publishedUrl: event.target.value }))
                }
                placeholder="https://"
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Tracking link</label>
              <select
                required
                disabled={!approved}
                value={publicationForm.trackingLinkId}
                onChange={(event) =>
                  setPublicationForm((current) => ({ ...current, trackingLinkId: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              >
                <option value="">Select a link</option>
                {data.links.map((link) => (
                  <option key={String(link.id)} value={String(link.id)}>
                    {String(link.title)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700">Publish date</label>
              <input
                type="date"
                disabled={!approved}
                value={publicationForm.publishedAt}
                onChange={(event) =>
                  setPublicationForm((current) => ({ ...current, publishedAt: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-secondary-50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!approved || submittingPublication}
            className="btn-accent mt-6 rounded-xl px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingPublication ? 'Submitting...' : 'Submit Publication'}
          </button>
        </form>
      </section>

      <section className="mt-10 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-secondary-900">Tracking Links</h2>
          <Link href="/partner-program/terms" className="text-sm font-medium text-primary-600 hover:text-primary-800">
            Program terms
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Label</th>
                <th className="pb-3 font-medium">Short Link</th>
                <th className="pb-3 font-medium">Target</th>
                <th className="pb-3 font-medium">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {data.links.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={4}>
                    No tracking links yet.
                  </td>
                </tr>
              ) : (
                data.links.map((link) => (
                  <tr key={String(link.id)} className="border-b border-secondary-100">
                    <td className="py-4 font-medium text-secondary-900">{String(link.title)}</td>
                    <td className="py-4 text-primary-700">
                      <a href={String(link.shortUrl || '')} target="_blank" rel="noopener noreferrer">
                        {String(link.shortUrl || '')}
                      </a>
                    </td>
                    <td className="py-4 text-secondary-600">{String(link.target_url || '')}</td>
                    <td className="py-4 text-secondary-900">{toNumber(link.click_count)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary-900">Publications</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Publication</th>
                <th className="pb-3 font-medium">Platform</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Clicks</th>
                <th className="pb-3 font-medium">Orders</th>
                <th className="pb-3 font-medium">Sales</th>
                <th className="pb-3 font-medium">Content Fee</th>
              </tr>
            </thead>
            <tbody>
              {data.publications.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={7}>
                    No publications submitted yet.
                  </td>
                </tr>
              ) : (
                data.publications.map((publication) => (
                  <tr key={String(publication.id)} className="border-b border-secondary-100">
                    <td className="py-4">
                      <a
                        href={String(publication.published_url || '')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-secondary-900 hover:text-primary-700"
                      >
                        {String(publication.title)}
                      </a>
                    </td>
                    <td className="py-4 text-secondary-700">{String(publication.platform)}</td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(String(publication.review_status || 'submitted'))}`}>
                        {String(publication.review_status || 'submitted')}
                      </span>
                    </td>
                    <td className="py-4 text-secondary-900">{toNumber(publication.click_count)}</td>
                    <td className="py-4 text-secondary-900">{toNumber(publication.order_count)}</td>
                    <td className="py-4 text-secondary-900">
                      {formatMoney(toNumber(publication.sales_amount))}
                    </td>
                    <td className="py-4 text-secondary-900">
                      {formatMoney(toNumber(publication.fee_amount))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary-900">Commission Ledger</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Net Sales</th>
                <th className="pb-3 font-medium">Commission</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.commissions.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={5}>
                    No attributed orders yet.
                  </td>
                </tr>
              ) : (
                data.commissions.map((item) => (
                  <tr key={String(item.id)} className="border-b border-secondary-100">
                    <td className="py-4 font-medium text-secondary-900">{String(item.order_number || 'Pending')}</td>
                    <td className="py-4 text-secondary-900">
                      {formatMoney(toNumber(item.net_amount), String(item.currency || 'USD'))}
                    </td>
                    <td className="py-4 text-secondary-900">
                      {formatMoney(toNumber(item.commission_amount), String(item.currency || 'USD'))}
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(String(item.status || 'pending'))}`}>
                        {String(item.status || 'pending')}
                      </span>
                    </td>
                    <td className="py-4 text-secondary-600">
                      {item.created_at ? new Date(String(item.created_at)).toLocaleDateString('en-US') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-secondary-900">Payout Ledger</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-secondary-200 text-secondary-500">
              <tr>
                <th className="pb-3 font-medium">Batch</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Paid At</th>
              </tr>
            </thead>
            <tbody>
              {data.payouts.length === 0 ? (
                <tr>
                  <td className="py-5 text-secondary-500" colSpan={5}>
                    No payout batches yet.
                  </td>
                </tr>
              ) : (
                data.payouts.map((item) => (
                  <tr key={String(item.id)} className="border-b border-secondary-100">
                    <td className="py-4 font-medium text-secondary-900">{String(item.payout_number)}</td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(String(item.status || 'pending'))}`}>
                        {String(item.status || 'pending')}
                      </span>
                    </td>
                    <td className="py-4 text-secondary-900">
                      {formatMoney(toNumber(item.total_amount), String(item.currency || 'USD'))}
                    </td>
                    <td className="py-4 text-secondary-700">{String(item.method || 'Pending')}</td>
                    <td className="py-4 text-secondary-600">
                      {item.paid_at ? new Date(String(item.paid_at)).toLocaleDateString('en-US') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
