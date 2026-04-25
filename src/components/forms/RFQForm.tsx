'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { clearRfqDraft, getRfqDraft, type RfqDraft } from '@/lib/rfq-draft'

interface FormErrors {
  name?: string
  email?: string
  company?: string
  message?: string
}

interface FormValues {
  name: string
  email: string
  phone: string
  company: string
  products: string
  quantity: string
  timeline: string
  message: string
  website_url: string
}

const EMPTY_FORM_VALUES: FormValues = {
  name: '',
  email: '',
  phone: '',
  company: '',
  products: '',
  quantity: '',
  timeline: '',
  message: '',
  website_url: '',
}

export function RFQForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM_VALUES)
  const [aiDraft, setAiDraft] = useState<RfqDraft | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const draft = getRfqDraft()
    if (!draft) return

    setAiDraft(draft)
    setFormValues((prev) => ({
      ...prev,
      products: draft.products || prev.products,
      quantity: draft.quantity || prev.quantity,
      timeline: draft.timeline || prev.timeline,
      message: draft.message || prev.message,
    }))
  }, [])

  // Accessibility: Focus on first error field when validation fails
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const firstErrorField = formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement
      firstErrorField?.focus()
    }
  }, [fieldErrors])

  // Accessibility: Focus on error summary when submission fails
  useEffect(() => {
    if (status === 'error' && errorSummaryRef.current) {
      errorSummaryRef.current.focus()
    }
  }, [status])

  function validateForm(values: FormValues): FormErrors {
    const errors: FormErrors = {}
    const name = values.name.trim()
    const email = values.email.trim()
    const company = values.company.trim()
    const message = values.message.trim()

    if (!name) errors.name = 'Full name is required'
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!company) errors.company = 'Company name is required'
    if (!message) errors.message = 'Please describe your requirements'

    return errors
  }

  function handleInputChange(field: keyof FormValues, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleClearAiDraft() {
    clearRfqDraft()
    setAiDraft(null)
    setFormValues((prev) => ({
      ...prev,
      products: '',
      quantity: '',
      timeline: '',
      message: '',
    }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    setFieldErrors({})

    // Client-side validation
    const errors = validateForm(formValues)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setStatus('error')
      setErrorMsg('Please fix the errors below')
      return
    }

    const body = {
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
      company: formValues.company.trim(),
      products: formValues.products.trim(),
      quantity: formValues.quantity.trim(),
      timeline: formValues.timeline.trim(),
      message: formValues.message.trim(),
      website_url: formValues.website_url.trim(),
      sourcePage: aiDraft ? `/rfq (prefilled from ${aiDraft.source})` : '/rfq',
      aiContext: aiDraft
        ? {
            source: aiDraft.source,
            sessionId: aiDraft.sessionId || '',
            sourcePage: aiDraft.sourcePage || '',
            sourceUrl: aiDraft.sourceUrl || '',
            updatedAt: aiDraft.updatedAt,
          }
        : null,
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
      setFormValues(EMPTY_FORM_VALUES)
      clearRfqDraft()
      setAiDraft(null)
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  if (status === 'success') {
    return (
      <div 
        role="status" 
        aria-live="polite"
        className="rounded-lg border border-green-200 bg-green-50 p-6 text-center"
      >
        <svg className="mx-auto h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-3 text-lg font-semibold text-green-800">Quote Request Submitted!</h3>
        <p className="mt-1 text-sm text-green-600">
          Thank you! Our team will review your request and respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-800"
        >
          Submit another request
        </button>
      </div>
    )
  }

  const hasErrors = Object.keys(fieldErrors).length > 0 || status === 'error'

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
      {aiDraft && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">We prefilled this RFQ from your AI conversation.</p>
          <p className="mt-1 text-amber-800">
            Review and edit the details before submitting. Source: {aiDraft.sourcePage || aiDraft.source}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearAiDraft}
              className="text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
            >
              Clear AI draft
            </button>
            <span className="text-xs text-amber-700">
              Updated {new Date(aiDraft.updatedAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Accessibility: Error summary at top */}
      {hasErrors && errorMsg && (
        <div 
          ref={errorSummaryRef}
          role="alert" 
          aria-live="assertive"
          tabIndex={-1}
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMsg}
        </div>
      )}

      {/* Contact info */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-secondary-800">Contact Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm text-secondary-700">
              Full Name <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input 
              type="text" id="name" name="name" required 
              className="input-field"
              value={formValues.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            />
            {fieldErrors.name && (
              <span id="name-error" role="alert" className="mt-1 block text-xs text-red-600">{fieldErrors.name}</span>
            )}
          </div>
          <div>
            <label htmlFor="company" className="mb-1 block text-sm text-secondary-700">
              Company <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input 
              type="text" id="company" name="company" required 
              className="input-field"
              value={formValues.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.company}
              aria-describedby={fieldErrors.company ? 'company-error' : undefined}
            />
            {fieldErrors.company && (
              <span id="company-error" role="alert" className="mt-1 block text-xs text-red-600">{fieldErrors.company}</span>
            )}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-secondary-700">
              Email <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input 
              type="email" id="email" name="email" required 
              className="input-field"
              value={formValues.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <span id="email-error" role="alert" className="mt-1 block text-xs text-red-600">{fieldErrors.email}</span>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm text-secondary-700">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="input-field"
              value={formValues.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
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
              value={formValues.products}
              onChange={(e) => handleInputChange('products', e.target.value)}
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
                value={formValues.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
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
                value={formValues.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm text-secondary-700">
              Additional Details <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Describe your requirements, specifications, or any questions..."
              className="input-field"
              value={formValues.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.message}
              aria-describedby={fieldErrors.message ? 'message-error' : undefined}
            />
            {fieldErrors.message && (
              <span id="message-error" role="alert" className="mt-1 block text-xs text-red-600">{fieldErrors.message}</span>
            )}
          </div>
        </div>
      </fieldset>

      {/* Honeypot - anti-spam */}
      <input
        type="text"
        name="website_url"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={formValues.website_url}
        onChange={(e) => handleInputChange('website_url', e.target.value)}
      />

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-accent px-8 disabled:opacity-60"
          aria-busy={status === 'loading'}
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
