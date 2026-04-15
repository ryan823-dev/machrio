import { NextResponse } from 'next/server'
import { resolveGlossaryPath } from '@/lib/url-resolution'

/**
 * Internal API used by middleware to determine whether a glossary URL should
 * render normally or permanently redirect to a maintained replacement.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const pathname = searchParams.get('pathname') || ''

  if (!slug) {
    return NextResponse.json({ exists: false, error: 'Missing slug parameter' }, { status: 400 })
  }

  try {
    const resolution = await resolveGlossaryPath(pathname, slug)
    return NextResponse.json(resolution)
  } catch (error) {
    console.error('[check-glossary] Error checking glossary path:', error)
    return NextResponse.json({ exists: true, error: 'Database error' })
  }
}
