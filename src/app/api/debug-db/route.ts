import { NextResponse } from 'next/server'

export async function GET() {
  const dbUri = process.env.DATABASE_URI

  if (!dbUri) {
    return NextResponse.json({ error: 'DATABASE_URI not set' })
  }

  // Parse the URI to show components (hide password)
  try {
    const url = new URL(dbUri)
    return NextResponse.json({
      protocol: url.protocol,
      username: url.username,
      password: '***HIDDEN***',
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      fullUriLength: dbUri.length,
      // Check for hidden characters
      hasHiddenChars: /[\x00-\x1F\x7F]/.test(dbUri),
    })
  } catch (e) {
    return NextResponse.json({
      error: 'Failed to parse DATABASE_URI',
      rawLength: dbUri.length,
      first50Chars: dbUri.substring(0, 50),
      parseError: e instanceof Error ? e.message : String(e),
    })
  }
}