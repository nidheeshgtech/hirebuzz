import { NextResponse } from 'next/server'
import { initDB, sql } from '@/lib/db'

export async function POST(request: Request) {
  try {
    await initDB()

    const body = await request.json()
    const { type, email, subscription } = body

    if (type === 'email') {
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
      }

      await sql`
        INSERT INTO email_subscribers (email)
        VALUES (${email.toLowerCase().trim()})
        ON CONFLICT (email) DO NOTHING
      `

      return NextResponse.json({ ok: true, message: 'Email subscribed!' })
    }

    if (type === 'push') {
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 })
      }

      await sql`
        INSERT INTO push_subscriptions (endpoint, p256dh, auth)
        VALUES (
          ${subscription.endpoint},
          ${subscription.keys.p256dh},
          ${subscription.keys.auth}
        )
        ON CONFLICT (endpoint) DO NOTHING
      `

      return NextResponse.json({ ok: true, message: 'Push notifications enabled!' })
    }

    return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 })
  } catch (err) {
    console.error('[/api/subscribe] Error:', err)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
