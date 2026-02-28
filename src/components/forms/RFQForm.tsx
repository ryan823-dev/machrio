'use client'

import { useState, type FormEvent } from 'react'

export function RFQForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const form = e.currentTarget
    const formData = new FormData(form)

    const body = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      company: formData.get('company'),
      products: formData.get('products') || '',
      quantity: formData.get('quantity') || '',
      timeline: formData.get('timeline') || '',
      message: formData.get('message'),
      website_url: formData.get('website_url') || '',
      sourcePage: '/rfq',
    }

    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(result.error || 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      form.reset()
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <svg className="mx-auto h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-3 text-lg font-semibold text-green-800">Quote Request Submitted!</h3>
        <p className="mt-1 text-sm text-green-600">
          Thank you! Our team will review your request and respond within 24 hours.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-800"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* Contact info */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-secondary-800">Contact Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-secondary-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input type="text" id="name" name="name" required className="input-field" />
          </div>
          <div>
            <label htmlFor="company" className="mb-1 block text-sm text-secondary-700">
              Company <span className="text-red-500">*</span>
            </label>
            <input type="text" id="company" name="company" required className="input-field" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-secondary-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" id="email" name="email" required className="input-field" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm text-secondary-700">
              Phone
            </label>
            <input type="tel" id="phone" name="phone" className="input-field" />
          </div>
        </div>
      </fieldset>

      {/* Product details */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-secondary-800">Product Details</legend>
        <div className="space-y-4">
          <div>
            <label htmlFor="products" className="mb-1 block text-sm text-secondary-700">
              Product Name(s) or SKU(s)
            </label>
            <input
              type="text"
              id="products"
              name="products"
              placeholder="e.g., MRO-GL-001, Nitrile Exam Gloves"
              className="input-field"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="quantity" className="mb-1 block text-sm text-secondary-700">
                Quantity Needed
              </label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                placeholder="e.g., 5000 units"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="timeline" className="mb-1 block text-sm text-secondary-700">
                Delivery Timeline
              </label>
              <input
                type="text"
                id="timeline"
                name="timeline"
                placeholder="e.g., Within 2 weeks"
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm text-secondary-700">
              Additional Details <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Describe your requirements, specifications, or any questions..."
              className="input-field"
            />
          </div>
        </div>
      </fieldset>

      {/* Honeypot - anti-spam */}
      <input type="text" name="website_url" className="hidden" tabIndex={-1} autoComplete="off" />

      {status === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-accent px-8 disabled:opacity-60"
        >
          {status === 'loading' ? 'Submitting...' : 'Submit Quote Request'}
        </button>
        <p className="text-xs text-secondary-400">
          We typically respond within 24 hours on business days.
        </p>
      </div>
    </form>
  )
}
