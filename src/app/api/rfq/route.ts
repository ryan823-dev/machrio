import { NextRequest, NextResponse } from 'next/server'
import { createRFQSubmission } from '@/lib/db'
import { sendRFQConfirmationEmail, sendRFQNotificationEmail } from '@/lib/email'
import {
  attachPartnerAttributionToRfq,
  ensurePartnerProgramTables,
} from '@/lib/partner-program'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    await ensurePartnerProgramTables()

    // Honeypot check
    if (data.website_url) {
      return NextResponse.json({ success: true }) // Silent reject
    }

    // Basic validation
    if (!data.name || !data.email || !data.company || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    const sanitizedSourcePage = sanitizeSourcePage(data.sourcePage)
    const aiContext = normalizeAiContext(data.aiContext)

    const resolvedSourcePage = buildRfqSourcePage(sanitizedSourcePage, aiContext)

    // Build full message with product details
    const parts = [data.message]
    if (data.products) parts.push(`Products: ${data.products}`)
    if (data.quantity) parts.push(`Quantity: ${data.quantity}`)
    if (data.timeline) parts.push(`Timeline: ${data.timeline}`)
    if (aiContext?.source) {
      parts.push(buildAiContextBlock(aiContext))
    }
    const fullMessage = parts.join('\n\n')

    // Store in database
    try {
      const submission = await createRFQSubmission({
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerCompany: data.company,
        message: fullMessage,
        sourcePage: resolvedSourcePage,
      })

      if (submission?.id) {
        await attachPartnerAttributionToRfq({
          headers: request.headers,
          rfqId: submission.id,
          customerEmail: data.email,
          customerCompany: data.company,
          sourcePage: resolvedSourcePage,
        })
      }
    } catch (dbError) {
      console.error('Failed to store RFQ submission:', dbError)
      // Continue even if DB storage fails - email is more important
    }

    // Send email notifications via Resend
    const emailData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      message: fullMessage,
      sourcePage: resolvedSourcePage,
    }

    // Send both emails in parallel
    await Promise.all([
      sendRFQConfirmationEmail(emailData),
      sendRFQNotificationEmail(emailData),
    ])

    console.log('RFQ submission received:', {
      customer: data.name,
      company: data.company,
      email: data.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully',
    })
  } catch (error) {
    console.error('RFQ submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

function sanitizeText(value: unknown, maxLength: number): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) return ''
  return raw.length <= maxLength ? raw : `${raw.slice(0, maxLength - 3)}...`
}

function sanitizeSourcePage(value: unknown, fallback = ''): string {
  const page = sanitizeText(value, 200)
  if (!page) return fallback
  return page.startsWith('/') ? page : `/${page}`
}

function normalizeAiContext(value: unknown): {
  source?: string
  sessionId?: string
  sourcePage?: string
  sourceUrl?: string
  updatedAt?: string
} | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const raw = value as Record<string, unknown>
  const source = sanitizeText(raw.source, 32)
  if (!source) return null

  return {
    source,
    sessionId: sanitizeText(raw.sessionId, 80) || undefined,
    sourcePage: sanitizeSourcePage(raw.sourcePage || '', ''),
    sourceUrl: sanitizeText(raw.sourceUrl, 180) || undefined,
    updatedAt: sanitizeText(raw.updatedAt, 40) || undefined,
  }
}

function buildRfqSourcePage(
  sourcePage: string,
  aiContext: {
    source?: string
    sessionId?: string
    sourcePage?: string
  } | null,
): string {
  const base = sourcePage || '/rfq'
  if (!aiContext?.source) return base

  const segments = [base, `draft-source=${aiContext.source}`]

  if (aiContext.sourcePage) {
    segments.push(`origin=${aiContext.sourcePage}`)
  }

  if (aiContext.sessionId) {
    segments.push(`session=${aiContext.sessionId}`)
  }

  return segments.join(' | ')
}

function buildAiContextBlock(aiContext: {
  source?: string
  sessionId?: string
  sourcePage?: string
  sourceUrl?: string
  updatedAt?: string
}): string {
  const lines = ['AI draft context:']

  if (aiContext.source) lines.push(`- Draft source: ${aiContext.source}`)
  if (aiContext.sessionId) lines.push(`- Session ID: ${aiContext.sessionId}`)
  if (aiContext.sourcePage) lines.push(`- Origin page: ${aiContext.sourcePage}`)
  if (aiContext.sourceUrl) lines.push(`- Origin URL: ${aiContext.sourceUrl}`)
  if (aiContext.updatedAt) lines.push(`- Draft updated at: ${aiContext.updatedAt}`)

  return lines.join('\n')
}
