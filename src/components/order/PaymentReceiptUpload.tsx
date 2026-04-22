'use client'

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { appendQueryParamsToPath } from '@/lib/order-access-links'
import {
  getBankTransferReference,
  type BankTransferSubmission,
} from '@/lib/bank-transfer'

interface PaymentReceiptUploadProps {
  orderNumber: string
  accessToken?: string
  currency: string
  existingSubmission?: BankTransferSubmission | null
}

interface PaymentFormState {
  amountPaid: string
  transferDate: string
  senderName: string
  bankName: string
  senderCountry: string
  notes: string
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function normalizeTransferDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean)
  return parts.join('-')
}

function isValidTransferDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function formatTransferDate(value: string | null | undefined): string {
  if (!value) return 'Not provided'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    dateStyle: 'medium',
  })
}

function formatSubmissionDate(value: string | null | undefined): string {
  if (!value) return 'Just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function PaymentReceiptUpload({
  orderNumber,
  accessToken,
  currency,
  existingSubmission,
}: PaymentReceiptUploadProps) {
  const router = useRouter()
  const paymentReference = getBankTransferReference(orderNumber)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedReference, setCopiedReference] = useState(false)
  const [editing, setEditing] = useState(!existingSubmission)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState<PaymentFormState>({
    amountPaid: existingSubmission?.amountPaid !== null && existingSubmission?.amountPaid !== undefined
      ? String(existingSubmission.amountPaid)
      : '',
    transferDate: existingSubmission?.transferDate?.slice(0, 10) || '',
    senderName: existingSubmission?.senderName || '',
    bankName: existingSubmission?.bankName || '',
    senderCountry: existingSubmission?.senderCountry || '',
    notes: existingSubmission?.notes || '',
  })

  const uploadUrl = appendQueryParamsToPath(`/api/orders/${orderNumber}/upload-receipt`, {
    access: accessToken,
  })

  function updateField(field: keyof PaymentFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleCopyReference() {
    try {
      await navigator.clipboard.writeText(paymentReference)
      setCopiedReference(true)
      window.setTimeout(() => setCopiedReference(false), 1800)
    } catch {
      setError('Could not copy the payment reference. Please copy it manually.')
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null
    if (!selectedFile) {
      setFile(null)
      return
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setFile(null)
      event.target.value = ''
      setError('Invalid file type. Please upload JPEG, PNG, GIF, or PDF.')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null)
      event.target.value = ''
      setError('File size exceeds 10MB limit.')
      return
    }

    setError(null)
    setFile(selectedFile)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amountPaid = Number(form.amountPaid)
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      setError('Please enter a valid amount paid.')
      return
    }

    if (!form.transferDate) {
      setError('Please provide the transfer date.')
      return
    }

    if (!isValidTransferDate(form.transferDate)) {
      setError('Please enter the transfer date in YYYY-MM-DD format.')
      return
    }

    if (!form.senderName.trim()) {
      setError('Please provide the sender name.')
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('amountPaid', form.amountPaid)
    formData.append('transferDate', form.transferDate)
    formData.append('senderName', form.senderName.trim())
    formData.append('paymentReference', paymentReference)

    if (form.bankName.trim()) {
      formData.append('bankName', form.bankName.trim())
    }
    if (form.senderCountry.trim()) {
      formData.append('senderCountry', form.senderCountry.trim())
    }
    if (form.notes.trim()) {
      formData.append('notes', form.notes.trim())
    }
    if (file) {
      formData.append('receipt', file)
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment details')
      }

      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setEditing(false)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit payment details')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-base font-semibold text-secondary-900">I&apos;ve sent the payment</h3>
        <p className="mt-1 text-sm text-secondary-600">
          Submit the key payment details so our finance team can match your transfer quickly. Proof is optional.
        </p>
      </div>

      <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Order Number</p>
        <p className="mt-1 font-mono text-sm font-semibold text-secondary-900">{orderNumber}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary-700">Payment Reference</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-white px-3 py-2 font-mono text-sm font-semibold text-secondary-900">
            {paymentReference}
          </span>
          <button
            type="button"
            onClick={handleCopyReference}
            className="text-sm font-medium text-primary-700 hover:text-primary-900"
          >
            {copiedReference ? 'Copied' : 'Copy reference'}
          </button>
        </div>
        <p className="mt-2 text-xs text-primary-700">
          Please use this reference in your bank transfer note or remittance message.
        </p>
      </div>

      {existingSubmission && !editing ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-800">Payment details submitted</p>
              <p className="mt-1 text-sm text-green-700">
                Submitted on {formatSubmissionDate(existingSubmission.submittedAt)}. Our finance team is now verifying the transfer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm font-medium text-green-800 hover:underline"
            >
              Update details
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Amount paid</p>
              <p className="mt-1 text-sm font-semibold text-secondary-900">
                {existingSubmission.amountPaid !== null && existingSubmission.amountPaid !== undefined
                  ? `${existingSubmission.amountPaid.toFixed(2)} ${currency}`
                  : 'Not provided'}
              </p>
            </div>
            <div className="rounded-md bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Transfer date</p>
              <p className="mt-1 text-sm font-semibold text-secondary-900">
                {formatTransferDate(existingSubmission.transferDate)}
              </p>
            </div>
            <div className="rounded-md bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Sender name</p>
              <p className="mt-1 text-sm font-semibold text-secondary-900">
                {existingSubmission.senderName || 'Not provided'}
              </p>
            </div>
            <div className="rounded-md bg-white/80 p-3">
              <p className="text-xs uppercase tracking-wide text-secondary-500">Proof</p>
              <p className="mt-1 text-sm font-semibold text-secondary-900">
                {existingSubmission.proofUploaded
                  ? existingSubmission.proofFilename || 'Attached'
                  : 'Not attached'}
              </p>
            </div>
          </div>

          {(existingSubmission.bankName || existingSubmission.senderCountry || existingSubmission.notes) && (
            <div className="mt-4 rounded-md bg-white/80 p-3 text-sm text-secondary-700">
              {existingSubmission.bankName && (
                <p>
                  <span className="font-medium text-secondary-900">Sending bank:</span> {existingSubmission.bankName}
                </p>
              )}
              {existingSubmission.senderCountry && (
                <p className="mt-1">
                  <span className="font-medium text-secondary-900">Sender country:</span> {existingSubmission.senderCountry}
                </p>
              )}
              {existingSubmission.notes && (
                <p className="mt-1">
                  <span className="font-medium text-secondary-900">Notes:</span> {existingSubmission.notes}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-secondary-200 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-secondary-700">Amount Paid ({currency})</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amountPaid}
                onChange={(event) => updateField('amountPaid', event.target.value)}
                className="input-field mt-1 w-full"
                placeholder="e.g. 1280.00"
                disabled={uploading}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-secondary-700">Transfer Date</span>
              <input
                type="text"
                value={form.transferDate}
                onChange={(event) => updateField('transferDate', normalizeTransferDateInput(event.target.value))}
                className="input-field mt-1 w-full"
                placeholder="YYYY-MM-DD"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                disabled={uploading}
                required
              />
              <p className="mt-1 text-xs text-secondary-500">Use the YYYY-MM-DD format.</p>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-secondary-700">Sender Name</span>
            <input
              type="text"
              value={form.senderName}
              onChange={(event) => updateField('senderName', event.target.value)}
              className="input-field mt-1 w-full"
              placeholder="Company or individual name shown on the transfer"
              disabled={uploading}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-secondary-700">Sending Bank (optional)</span>
              <input
                type="text"
                value={form.bankName}
                onChange={(event) => updateField('bankName', event.target.value)}
                className="input-field mt-1 w-full"
                placeholder="Bank of China, HSBC, Citi..."
                disabled={uploading}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-secondary-700">Sender Country (optional)</span>
              <input
                type="text"
                value={form.senderCountry}
                onChange={(event) => updateField('senderCountry', event.target.value)}
                className="input-field mt-1 w-full"
                placeholder="Country where the transfer was sent"
                disabled={uploading}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-secondary-700">Notes (optional)</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              className="input-field mt-1 w-full"
              placeholder="Any remittance note, sender details, or bank fee comments"
              disabled={uploading}
            />
          </label>

          <div className="block">
            <span className="text-sm font-medium text-secondary-700">Payment Proof (optional)</span>
            <input
              id={`payment-proof-${orderNumber}`}
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.pdf"
              onChange={handleFileChange}
              className="sr-only"
              disabled={uploading}
            />
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <label
                htmlFor={`payment-proof-${orderNumber}`}
                className={`inline-flex cursor-pointer items-center rounded-md border border-secondary-300 bg-secondary-100 px-3 py-2 text-sm font-medium text-secondary-700 transition hover:bg-secondary-200 ${
                  uploading ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                {file ? 'Choose Another File' : 'Choose File'}
              </label>
              <span className="text-sm text-secondary-600">
                {file ? file.name : 'No file selected'}
              </span>
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setError(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="text-sm font-medium text-primary-700 hover:text-primary-900"
                  disabled={uploading}
                >
                  Remove
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-secondary-500">
              Optional screenshot or bank advice. JPEG, PNG, GIF, or PDF up to 10MB.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? 'Submitting...' : 'Submit Payment Details'}
            </button>
            {existingSubmission && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setError(null)
                  setFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="btn-secondary"
                disabled={uploading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">What happens next?</h4>
        <ol className="mt-2 space-y-1 text-sm text-blue-800">
          <li>1. Submit your amount, transfer date, and sender name.</li>
          <li>2. Our finance team matches the transfer with your order and payment reference.</li>
          <li>3. Once confirmed, your order status changes to Paid and processing begins.</li>
        </ol>
      </div>
    </div>
  )
}
