'use client'

import { useState, useRef } from 'react'
import { appendQueryParamsToPath } from '@/lib/order-access-links'

interface PaymentReceiptUploadProps {
  orderNumber: string
  accessToken?: string
  onUploadSuccess?: () => void
}

export function PaymentReceiptUpload({
  orderNumber,
  accessToken,
  onUploadSuccess,
}: PaymentReceiptUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadUrl = appendQueryParamsToPath(`/api/orders/${orderNumber}/upload-receipt`, {
    access: accessToken,
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, GIF, or PDF.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      return
    }

    // Upload file
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload receipt')
      }

      setSuccess(true)
      onUploadSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipt')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, GIF, or PDF.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      return
    }

    // Upload file
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('receipt', file)

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload receipt')
      }

      setSuccess(true)
      onUploadSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload receipt')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-secondary-900">Upload Payment Receipt</h3>
        <p className="mt-1 text-sm text-secondary-600">
          Upload a photo or PDF of your bank transfer receipt as proof of payment.
        </p>
      </div>

      {success ? (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium text-green-800">Receipt uploaded successfully!</p>
              <p className="mt-1 text-sm text-green-700">
                Our finance team will review your payment receipt and confirm your order within 1-2 business days.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative border-2 border-dashed border-secondary-300 rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          <div className="flex flex-col items-center justify-center text-center">
            {uploading ? (
              <>
                <svg className="animate-spin h-10 w-10 text-primary-600 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm font-medium text-secondary-700">Uploading...</p>
              </>
            ) : (
              <>
                <svg className="h-10 w-10 text-secondary-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-secondary-700 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-secondary-500">
                  JPEG, PNG, GIF or PDF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-red-800">Upload failed</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs font-medium text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h4>
        <ol className="space-y-1 text-sm text-blue-800">
          <li>1. Upload your bank transfer receipt</li>
          <li>2. Our finance team reviews the payment (1-2 business days)</li>
          <li>3. Once confirmed, your order status will be updated to "Paid"</li>
          <li>4. We'll send you a confirmation email and begin processing your order</li>
        </ol>
      </div>
    </div>
  )
}
