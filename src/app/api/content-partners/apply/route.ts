import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    
    const name = body.get('name') as string
    const email = body.get('email') as string
    const website = body.get('website') as string | null
    const expertise = body.getAll('expertise') as string[]
    const topic = body.get('topic') as string
    const message = body.get('message') as string | null

    // Validation
    if (!name || !email || !topic || !expertise || expertise.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const pool = getPool()
    
    // Insert into database
    const result = await pool.query(
      `INSERT INTO content_partners (
        name, email, website, expertise, topic, message, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, name, email, created_at`,
      [
        name,
        email,
        website || null,
        expertise,
        topic,
        message || null,
      ]
    )

    const partner = result.rows[0]

    // TODO: Send email notification to admin and applicant
    // For now, just log
    console.log('[Content Partner] New application:', {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      topic,
      expertise,
    })

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully! We will review your submission and get back to you within 3-5 business days.',
      partnerId: partner.id,
    })
  } catch (error) {
    console.error('[Content Partner] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again later.' },
      { status: 500 }
    )
  }
}
