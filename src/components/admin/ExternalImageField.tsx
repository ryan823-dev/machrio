'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { toast } from 'sonner'

export const ExternalImageField: React.FC<{ path?: string }> = ({ path: pathProp }) => {
  const fieldPath = pathProp || 'externalImageUrl'
  const { value = '', setValue } = useField<string>({ path: fieldPath })

  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    if (uploading) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/oss', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.success && data.url) {
        setValue(data.url)
        setPreviewError(false)
        toast.success('图片上传成功')
      } else {
        toast.error(data.error || '上传失败')
      }
    } catch {
      toast.error('网络错误，上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [uploading, setValue])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleClear = useCallback(() => {
    setValue('')
    setPreviewError(false)
  }, [setValue])

  const hasImage = typeof value === 'string' && value.length > 0

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Label */}
      <label style={{
        display: 'block',
        fontWeight: 600,
        fontSize: '14px',
        marginBottom: '6px',
        color: 'var(--theme-text, #1a1a2e)',
      }}>
        External Image URL
      </label>
      <p style={{
        fontSize: '12px',
        color: 'var(--theme-elevation-500, #6b7280)',
        margin: '0 0 12px 0',
      }}>
        产品主图 — 支持直接粘贴 URL 或上传图片到 OSS
      </p>

      {/* Preview area */}
      <div style={{
        width: '100%',
        maxWidth: '320px',
        aspectRatio: '1',
        borderRadius: '8px',
        border: `2px ${dragOver ? 'solid #3b82f6' : 'dashed #d1d5db'}`,
        background: dragOver ? '#eff6ff' : '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: '12px',
        position: 'relative',
        transition: 'border-color 0.2s, background 0.2s',
      }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 8px',
            }} />
            <span style={{ fontSize: '13px' }}>上传中...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : hasImage && !previewError ? (
          <img
            src={value as string}
            alt="Product image preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={() => setPreviewError(true)}
          />
        ) : hasImage && previewError ? (
          <div style={{ textAlign: 'center', color: '#ef4444', padding: '16px' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span style={{ fontSize: '12px' }}>图片加载失败</span>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span style={{ fontSize: '13px' }}>拖拽图片到此处或点击上传</span>
          </div>
        )}
      </div>

      {/* URL input */}
      <input
        type="text"
        value={(value as string) || ''}
        onChange={(e) => {
          setValue(e.target.value)
          setPreviewError(false)
        }}
        placeholder="输入图片 URL 或上传图片到 OSS"
        disabled={uploading}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--theme-elevation-150, #d1d5db)',
          borderRadius: '6px',
          fontSize: '14px',
          fontFamily: 'monospace',
          background: 'var(--theme-input-bg, #fff)',
          color: 'var(--theme-text, #1a1a2e)',
          marginBottom: '10px',
          boxSizing: 'border-box',
        }}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: uploading ? '#94a3b8' : '#10b981',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 500,
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? '上传中...' : '上传图片'}
        </button>

        {hasImage && (
          <button
            type="button"
            onClick={handleClear}
            disabled={uploading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              color: '#ef4444',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #fca5a5',
              fontSize: '13px',
              fontWeight: 500,
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            清除
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default ExternalImageField
