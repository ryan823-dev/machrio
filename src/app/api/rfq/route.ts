import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendRFQConfirmationEmail, sendRFQNotificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const data = await request.json()

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

    // Store in Payload CMS
    try {
      const payload = await getPayload({ config })
      await payload.create({
        collection: 'rfq-submissions',
        draft: false,
        data: {
          customer: {
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            company: data.company,
          },
          inquiry: {
            message: fullMessage,
          },
          source: {
            page: data.sourcePage || '/rfq',
          },
          status: 'new' as const,
          submittedAt: new Date().toISOString(),
        },
      })
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
