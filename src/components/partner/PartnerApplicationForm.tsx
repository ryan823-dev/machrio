'use client'

import { useState } from 'react'

const platformOptions = [
  'Website / Blog',
  'YouTube',
  'LinkedIn',
  'Instagram',
  'TikTok',
  'Newsletter',
  'Other',
]

export function PartnerApplicationForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{
    partnerCode: string
    status: string
  } | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    website: '',
    country: '',
    mainPlatform: platformOptions[0],
    expertise: '',
    platformLinks: '',
    sampleWorkUrls: '',
    topicPitch: '',
    payoutMethod: 'PayPal',
    payoutAccount: '',
    message: '',
  })

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/partner-program/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expertise: form.expertise
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          platformLinks: form.platformLinks
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          sampleWorkUrls: form.sampleWorkUrls
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit your application.')
        return
      }

      setSuccess({
        partnerCode: data.partner.partnerCode,
        status: data.partner.status,
      })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-green-900">Application Submitted</h2>
        <p className="mt-2 text-green-800">
          Your partner profile is now in review. We will check your channels, content fit, and payout details before approving link generation.
        </p>
        <div className="mt-6 grid gap-3 rounded-xl border border-green-200 bg-white p-5 text-sm text-secondary-700 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Partner Code</p>
            <p className="mt-1 font-semibold text-secondary-900">{success.partnerCode}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary-500">Status</p>
            <p className="mt-1 font-semibold capitalize text-secondary-900">{success.status}</p>
          </div>
        </div>
        <p className="mt-5 text-sm text-green-900">
          Once approved, you can sign in to the dashboard to generate short links, submit publications, and monitor clicks, RFQs, orders, sales, and commissions.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-secondary-700">Full name</label>
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Website</label>
          <input
            value={form.website}
            onChange={(event) => updateField('website', event.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Country / region</label>
          <input
            value={form.country}
            onChange={(event) => updateField('country', event.target.value)}
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Primary platform</label>
          <select
            value={form.mainPlatform}
            onChange={(event) => updateField('mainPlatform', event.target.value)}
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            {platformOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Preferred payout method</label>
          <select
            value={form.payoutMethod}
            onChange={(event) => updateField('payoutMethod', event.target.value)}
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="PayPal">PayPal</option>
            <option value="Bank Transfer">Bank transfer</option>
            <option value="Wise">Wise</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700">Expertise areas</label>
        <input
          value={form.expertise}
          onChange={(event) => updateField('expertise', event.target.value)}
          placeholder="industrial automation, PPE, technical writing"
          className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        <p className="mt-2 text-xs text-secondary-500">Use commas to separate topics or industries.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700">Platform links</label>
        <textarea
          rows={4}
          value={form.platformLinks}
          onChange={(event) => updateField('platformLinks', event.target.value)}
          placeholder="One URL per line"
          className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700">Sample work URLs</label>
        <textarea
          rows={4}
          value={form.sampleWorkUrls}
          onChange={(event) => updateField('sampleWorkUrls', event.target.value)}
          placeholder="Published articles, videos, or channel posts"
          className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700">Promotion focus or topic pitch</label>
        <input
          value={form.topicPitch}
          onChange={(event) => updateField('topicPitch', event.target.value)}
          placeholder="Servo motors for food processing lines"
          className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <label className="block text-sm font-medium text-secondary-700">Why are you a fit?</label>
          <textarea
            rows={5}
            value={form.message}
            onChange={(event) => updateField('message', event.target.value)}
            placeholder="Tell us about your audience, content format, and how you would promote Machrio."
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700">Payout account</label>
          <input
            value={form.payoutAccount}
            onChange={(event) => updateField('payoutAccount', event.target.value)}
            placeholder="PayPal email or bank alias"
            className="mt-1 w-full rounded-xl border border-secondary-300 px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          />
          <div className="mt-4 rounded-xl bg-secondary-50 p-4 text-sm text-secondary-600">
            Fixed content fee:
            <strong className="ml-1 text-secondary-900">$10-30</strong>
            <br />
            Sales commission:
            <strong className="ml-1 text-secondary-900">3% of net sales</strong>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="btn-accent rounded-xl px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Submitting...' : 'Apply to the Partner Program'}
      </button>
    </form>
  )
}
