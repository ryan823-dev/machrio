import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const payload = await getPayload({ config })

    // Find and delete the session
    const sessions = await payload.find({
      collection: 'account-sessions' as any as any,
      where: { token: { equals: token } },
      limit: 1,
    })

    if (sessions.docs.length > 0) {
      await payload.delete({
        collection: 'account-sessions' as any as any,
        id: sessions.docs[0].id,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
