import { NextRequest, NextResponse } from 'next/server'
import { uploadToOSS } from '@/lib/oss'

export const runtime = 'nodejs'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: '未提供文件' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: `不支持的文件类型: ${file.type}。支持: JPEG, PNG, WebP, GIF, SVG` },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)。最大允许 10MB` },
        { status: 413 },
      )
    }

    // Convert to Buffer and upload
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadToOSS(buffer, file.name, file.type)

    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('[OSS Upload Error]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '上传失败，请重试' },
      { status: 500 },
    )
  }
}
