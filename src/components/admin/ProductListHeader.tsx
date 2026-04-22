'use client'

import React, { useState } from 'react'

export const ProductListHeader: React.FC = () => {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      window.location.href = '/api/products/export'
    } finally {
      setTimeout(() => setExporting(false), 2000)
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
      padding: '16px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      flexWrap: 'wrap',
    }}>
      <a
        href="/admin/bulk-import"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#10b981',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Bulk Product Import
      </a>
      <a
        href="/api/products/bulk-import/template"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#0070f3',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Import Template
      </a>
      <button
        onClick={handleExport}
        disabled={exporting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: exporting ? '#94a3b8' : '#8b5cf6',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          fontSize: '14px',
          fontWeight: 500,
          cursor: exporting ? 'not-allowed' : 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {exporting ? 'Exporting...' : 'Bulk Product Export'}
      </button>
    </div>
  )
}

export default ProductListHeader
