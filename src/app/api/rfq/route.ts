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

    // Build full message with product details
    const parts = [data.message]
    if (data.products) parts.push(`Products: ${data.products}`)
    if (data.quantity) parts.push(`Quantity: ${data.quantity}`)
    if (data.timeline) parts.push(`Timeline: ${data.timeline}`)
    const fullMessage = parts.join('\n\n')

    // Store in database
    try {
      const submission = await createRFQSubmission({
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerCompany: data.company,
        message: fullMessage,
        sourcePage: data.sourcePage,
      })

      if (submission?.id) {
        await attachPartnerAttributionToRfq({
          headers: request.headers,
          rfqId: submission.id,
          customerEmail: data.email,
          customerCompany: data.company,
          sourcePage: data.sourcePage,
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
      sourcePage: data.sourcePage,
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
