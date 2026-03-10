'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { toast } from 'sonner'

// Upload helper
async function uploadToOSS(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload/oss', { method: 'POST', body: formData })
  const data = await res.json()
  if (!data.success || !data.url) throw new Error(data.error || '上传失败')
  return data.url
}

// Action icon button
function ActionIcon({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        background: 'none', border: 'none', padding: '6px',
        cursor: 'pointer', color: '#666', borderRadius: '4px',
        display: 'inline-flex', alignItems: 'center',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = '#2563eb'
        ;(e.currentTarget as HTMLButtonElement).style.background = '#f0f7ff'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = '#666'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

// Cover image card
function CoverImageCard({
  url,
  uploading,
  onUpload,
  onZoom,
  onReplace,
  onDelete,
  onDrop,
}: {
  url: string
  uploading: boolean
  onUpload: () => void
  onZoom: () => void
  onReplace: () => void
  onDelete: () => void
  onDrop: (e: React.DragEvent) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const hasImage = url.length > 0

  return (
    <div
      style={{
        width: '220px',
        border: `1px solid ${dragOver ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '8px',
        background: dragOver ? '#f0f7ff' : '#fff',
        overflow: 'hidden',
        transition: 'border-color .2s, background .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(e) }}
    >
      {/* Image area */}
      <div style={{
        width: '100%',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        cursor: hasImage ? 'default' : 'pointer',
        position: 'relative',
      }}
        onClick={!hasImage ? onUpload : undefined}
      >
        {uploading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{
              width: '32px', height: '32px',
              border: '3px solid #e5e7eb', borderTopColor: '#3b82f6',
              borderRadius: '50%', animation: 'pim-spin .8s linear infinite',
              margin: '0 auto 8px',
            }} />
            <span style={{ fontSize: '13px' }}>上传中...</span>
          </div>
        ) : hasImage && !imgErr ? (
          <img
            src={url}
            alt="封面图"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={() => setImgErr(true)}
          />
        ) : hasImage && imgErr ? (
          <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '12px', padding: '16px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 6px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
            图片加载失败
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ display: 'block', margin: '0 auto 8px', opacity: .45 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
            </svg>
            点击或拖拽上传封面图
          </div>
        )}
      </div>

      {/* Action bar */}
      {hasImage && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '16px',
          padding: '8px 0', borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
        }}>
          <ActionIcon title="放大查看" onClick={onZoom}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </ActionIcon>
          <ActionIcon title="替换图片" onClick={onReplace}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </ActionIcon>
          <ActionIcon title="删除图片" onClick={onDelete}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </ActionIcon>
        </div>
      )}
    </div>
  )
}

// Thumbnail card for gallery
function ThumbCard({
  url,
  uploading,
  onReplace,
  onDelete,
  onZoom,
}: {
  url: string
  uploading: boolean
  onReplace: () => void
  onDelete: () => void
  onZoom: () => void
}) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div style={{
      width: '160px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#fff',
      position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: '100%', height: '150px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fafafa',
      }}>
        {uploading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{
              width: '24px', height: '24px',
              border: '3px solid #e5e7eb', borderTopColor: '#3b82f6',
              borderRadius: '50%', animation: 'pim-spin .8s linear infinite',
              margin: '0 auto 4px',
            }} />
            <span style={{ fontSize: '11px' }}>上传中...</span>
          </div>
        ) : !imgErr ? (
          <img
            src={url}
            alt="产品图"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <span style={{ color: '#ccc', fontSize: '11px' }}>加载失败</span>
        )}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '12px',
        padding: '6px 0', borderTop: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        <ActionIcon title="放大" onClick={onZoom}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </ActionIcon>
        <ActionIcon title="替换" onClick={onReplace}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </ActionIcon>
        <ActionIcon title="删除" onClick={onDelete}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </ActionIcon>
      </div>
    </div>
  )
}

// Zoom modal
function ZoomModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,.7)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={url}
        alt="放大查看"
        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 40px rgba(0,0,0,.5)' }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// Main component
export const ProductImageManager: React.FC<{ path?: string }> = () => {
  // Manage externalImageUrl as cover
  const { value: coverUrl = '', setValue: setCoverUrl } = useField<string>({ path: 'externalImageUrl' })
  // Manage additionalImageUrls as gallery
  const { value: galleryRaw, setValue: setGallery } = useField<string[]>({ path: 'additionalImageUrls' })
  const galleryUrls: string[] = Array.isArray(galleryRaw) ? galleryRaw.filter(Boolean) : []

  const [uploading, setUploading] = useState<'cover' | number | 'new' | null>(null)
  const [zoomUrl, setZoomUrl] = useState<string | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const replaceIdxRef = useRef<number | null>(null)

  const doUpload = useCallback(async (file: File, target: 'cover' | number | 'new') => {
    if (uploading !== null) return
    setUploading(target)
    try {
      const url = await uploadToOSS(file)
      if (target === 'cover') {
        setCoverUrl(url)
      } else if (target === 'new') {
        setGallery([...galleryUrls, url])
      } else {
        const next = [...galleryUrls]
        next[target] = url
        setGallery(next)
      }
      toast.success('图片上传成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(null)
    }
  }, [uploading, setCoverUrl, setGallery, galleryUrls])

  const onCoverFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) doUpload(f, 'cover')
    e.target.value = ''
  }, [doUpload])

  const onGalleryFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const idx = replaceIdxRef.current
    doUpload(f, idx !== null ? idx : 'new')
    replaceIdxRef.current = null
    e.target.value = ''
  }, [doUpload])

  const triggerGalleryReplace = (idx: number) => {
    replaceIdxRef.current = idx
    galleryInputRef.current?.click()
  }

  const triggerGalleryAdd = () => {
    replaceIdxRef.current = null
    galleryInputRef.current?.click()
  }

  const deleteGallery = (idx: number) => {
    const next = galleryUrls.filter((_, i) => i !== idx)
    setGallery(next.length > 0 ? next : [])
  }

  const onCoverDrop = useCallback((e: React.DragEvent) => {
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) doUpload(f, 'cover')
  }, [doUpload])

  return (
    <div style={{ padding: '8px 0 16px' }}>
      <style>{`@keyframes pim-spin { to { transform: rotate(360deg) } }`}</style>

      {/* Section: 封面图 */}
      <h4 style={{
        fontSize: '16px', fontWeight: 600, margin: '0 0 16px',
        color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <span style={{
          display: 'inline-block', width: '4px', height: '18px',
          background: '#3b82f6', borderRadius: '2px'
        }} />
        封面图
      </h4>

      <CoverImageCard
        url={(coverUrl as string) || ''}
        uploading={uploading === 'cover'}
        onUpload={() => coverInputRef.current?.click()}
        onZoom={() => coverUrl && setZoomUrl(coverUrl as string)}
        onReplace={() => coverInputRef.current?.click()}
        onDelete={() => setCoverUrl('')}
        onDrop={onCoverDrop}
      />

      {/* Section: 产品图 */}
      <h4 style={{
        fontSize: '16px', fontWeight: 600, margin: '28px 0 16px',
        color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <span style={{
          display: 'inline-block', width: '4px', height: '18px',
          background: '#3b82f6', borderRadius: '2px'
        }} />
        产品图
      </h4>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {galleryUrls.map((url, idx) => (
          <ThumbCard
            key={`${url}-${idx}`}
            url={url}
            uploading={uploading === idx}
            onZoom={() => setZoomUrl(url)}
            onReplace={() => triggerGalleryReplace(idx)}
            onDelete={() => deleteGallery(idx)}
          />
        ))}

        {/* Add new card */}
        <div
          onClick={uploading === 'new' ? undefined : triggerGalleryAdd}
          style={{
            width: '160px', height: '196px',
            border: '2px dashed #d1d5db', borderRadius: '8px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: uploading === 'new' ? 'wait' : 'pointer',
            color: '#9ca3af', fontSize: '13px',
            background: '#fafafa',
            transition: 'border-color .2s, background .2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6'
            ;(e.currentTarget as HTMLDivElement).style.background = '#f0f7ff'
            ;(e.currentTarget as HTMLDivElement).style.color = '#3b82f6'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db'
            ;(e.currentTarget as HTMLDivElement).style.background = '#fafafa'
            ;(e.currentTarget as HTMLDivElement).style.color = '#9ca3af'
          }}
          onDragOver={(e) => { e.preventDefault() }}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f && f.type.startsWith('image/')) doUpload(f, 'new')
          }}
        >
          {uploading === 'new' ? (
            <>
              <div style={{
                width: '28px', height: '28px',
                border: '3px solid #e5e7eb', borderTopColor: '#3b82f6',
                borderRadius: '50%', animation: 'pim-spin .8s linear infinite',
                marginBottom: '8px',
              }} />
              上传中...
            </>
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '6px', opacity: .6 }}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加图片
            </>
          )}
        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverFileChange} style={{ display: 'none' }} />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={onGalleryFileChange} style={{ display: 'none' }} />

      {/* Zoom modal */}
      {zoomUrl && <ZoomModal url={zoomUrl} onClose={() => setZoomUrl(null)} />}
    </div>
  )
}

export default ProductImageManager
