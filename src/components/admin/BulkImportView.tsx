'use client'

import React, { useCallback, useRef, useState } from 'react'

interface ImportResult {
  success: number
  failed: number
  errors: { row: number; sku: string; error: string }[]
  message: string
}

export const BulkImportView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        body: formData,
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers.get('content-type'))

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 500))
        throw new Error(`Server returned a non-JSON response (HTTP ${response.status}): ${text.substring(0, 200)}`)
      }

      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        setError(data.error || 'Import failed')
      } else {
        setResult(data)
      }
    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during import')
    } finally {
      setLoading(false)
    }
  }, [file])

  const handleDownloadTemplate = useCallback(() => {
    window.location.href = '/api/products/bulk-import/template'
  }, [])

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        Bulk Product Import
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Upload product data in bulk with an Excel spreadsheet.
      </p>

      {/* Template Download */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          Step 1: Download the Template
        </h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          Download the Excel template first, then fill in your product data using the required format. Field guidance is included in the file.
        </p>
        <button
          onClick={handleDownloadTemplate}
          style={{
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Download Import Template
        </button>
      </div>

      {/* File Upload */}
      <div style={{
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          Step 2: Upload Your File
        </h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          Choose the completed Excel file (`.xlsx` or `.xls`) and start the bulk import.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#eef2ff',
              color: '#3730a3',
              border: '1px solid #c7d2fe',
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {file ? 'Choose Another File' : 'Choose File'}
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {file ? file.name : 'No file selected'}
          </span>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            style={{
              background: file && !loading ? '#10b981' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: file && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
        
        {file && (
          <p style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
            Selected file: {file.name}
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          color: '#dc2626',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{
          background: result.failed > 0 ? '#fffbeb' : '#f0fdf4',
          border: `1px solid ${result.failed > 0 ? '#fde68a' : '#bbf7d0'}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            marginBottom: '12px',
            color: result.failed > 0 ? '#d97706' : '#16a34a',
          }}>
            {result.message}
          </h3>
          
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <div>
              <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '24px' }}>
                {result.success}
              </span>
              <span style={{ color: '#666', marginLeft: '4px' }}>Succeeded</span>
            </div>
            <div>
              <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '24px' }}>
                {result.failed}
              </span>
              <span style={{ color: '#666', marginLeft: '4px' }}>Failed</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Error Details:
              </h4>
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                maxHeight: '200px',
                overflow: 'auto',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Row</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>SKU</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>{err.row}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>{err.sku}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        padding: '20px',
        background: '#f1f5f9',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#475569',
      }}>
        <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Notes:</h4>
        <ul style={{ paddingLeft: '20px', lineHeight: 1.8, margin: 0 }}>
          <li>Category names must exactly match the existing L1/L2/L3 category names in the system.</li>
          <li>If a SKU already exists, the importer updates the existing product.</li>
          <li>If a SKU does not exist, the importer creates a new product.</li>
          <li>Up to 9 specification pairs are supported (`Spec 1-9 Name/Value`).</li>
          <li>The `Source URL` field stores the original product source link.</li>
        </ul>
      </div>
    </div>
  )
}

export default BulkImportView
