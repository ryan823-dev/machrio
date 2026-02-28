'use client'

import { useState, type FormEvent } from 'react'

export function ContactForm() {
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
      company: formData.get('company') || '',
      subject: formData.get('subject'),
      message: formData.get('message'),
      website_url: formData.get('website_url') || '',
    }

    try {
      const res = await fetch('/api/contact', {
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
        <h3 className="mt-3 text-lg font-semibold text-green-800">Message Sent!</h3>
        <p className="mt-1 text-sm text-green-600">
          Thank you for reaching out. We&apos;ll respond within 1 business day.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-800"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="input-field mt-1 w-full"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="input-field mt-1 w-full"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="input-field mt-1 w-full"
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-secondary-700">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            className="input-field mt-1 w-full"
            placeholder="Your company"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-secondary-700">
          Subject <span className="text-red-500">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          className="input-field mt-1 w-full"
          defaultValue=""
        >
          <option value="" disabled>Select a topic</option>
          <option value="general">General Inquiry</option>
          <option value="support">Customer Support</option>
          <option value="order">Order Status</option>
          <option value="return">Returns &amp; Refunds</option>
          <option value="partnership">Business Partnership</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-secondary-700">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="input-field mt-1 w-full"
          placeholder="How can we help you?"
        />
      </div>

      {/* Honeypot */}
      <input type="text" name="website_url" className="hidden" tabIndex={-1} autoComplete="off" />

      {status === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary w-full py-3 disabled:opacity-60"
        >
          {status === 'loading' ? 'Sending...' : 'Send Message'}
        </button>
        <p className="mt-2 text-center text-xs text-secondary-500">
          We typically respond within 1 business day.
        </p>
      </div>
    </form>
  )
}
