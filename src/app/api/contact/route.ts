import { NextResponse } from 'next/server'
import { createContactSubmission } from '@/lib/db'
import { sendContactConfirmationEmail, sendContactNotificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Honeypot check
    if (data.website_url) {
      return NextResponse.json({ success: true })
    }

    // Validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 },
      )
    }

    // Store in database
    try {
      await createContactSubmission({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        subject: data.subject,
        message: data.message,
      })
    } catch (dbError) {
      console.error('Failed to store contact submission:', dbError)
      // Continue even if DB storage fails - email is more important
    }

    // Send emails
    const emailData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      subject: data.subject,
      message: data.message,
    }

    await Promise.all([
      sendContactConfirmationEmail(emailData),
      sendContactNotificationEmail(emailData),
    ])

    console.log('Contact submission received:', {
      name: data.name,
      email: data.email,
      subject: data.subject,
    })

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    })
  } catch (error) {
    console.error('Contact submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}