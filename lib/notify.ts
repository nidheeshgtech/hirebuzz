import webpush from 'web-push'
import nodemailer from 'nodemailer'
import { getAllPushSubscriptions, getAllEmailSubscribers, type Job } from './db'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:hirebuzz@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export async function sendPushNotifications(newJobs: Job[]) {
  if (newJobs.length === 0) return

  const subscriptions = await getAllPushSubscriptions()
  if (subscriptions.length === 0) return

  const payload = JSON.stringify({
    title: `HireBuzz: ${newJobs.length} new Biology job${newJobs.length > 1 ? 's' : ''} in Dubai!`,
    body: newJobs
      .slice(0, 3)
      .map((j) => `${j.title} @ ${j.company}`)
      .join('\n'),
    url: '/',
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  )

  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`[push] Sent to ${subscriptions.length} subs, ${failed} failed`)
}

export async function sendEmailAlerts(newJobs: Job[]) {
  if (newJobs.length === 0) return

  const subscribers = await getAllEmailSubscribers()
  if (subscribers.length === 0) return

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  const jobRows = newJobs
    .map(
      (j) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;">
          <a href="${j.url}" style="color:#2563eb;font-weight:600;text-decoration:none;">${j.title}</a><br>
          <span style="color:#555;font-size:13px;">${j.company} · ${j.location}</span><br>
          <span style="color:#888;font-size:12px;">${(j.description || '').slice(0, 120)}…</span>
        </td>
      </tr>`
    )
    .join('')

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2563eb;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🐝 HireBuzz</h1>
        <p style="color:#bfdbfe;margin:4px 0 0;">New Biology Teacher Jobs in Dubai</p>
      </div>
      <div style="background:#fff;padding:20px 24px;border:1px solid #e5e7eb;border-top:none;">
        <p style="color:#374151;margin-top:0;">We found <strong>${newJobs.length} new job listing${newJobs.length > 1 ? 's' : ''}</strong> for you:</p>
        <table width="100%" cellpadding="0" cellspacing="0">${jobRows}</table>
        <p style="margin-top:24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://hirebuzz.vercel.app'}"
             style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
            View All Jobs →
          </a>
        </p>
      </div>
      <p style="color:#9ca3af;font-size:12px;padding:8px 0;text-align:center;">
        HireBuzz · You're receiving this because you subscribed for Biology teacher job alerts.
      </p>
    </div>
  `

  for (const sub of subscribers) {
    try {
      await transporter.sendMail({
        from: `HireBuzz <${process.env.GMAIL_USER}>`,
        to: sub.email,
        subject: `🐝 ${newJobs.length} New Biology Teacher Job${newJobs.length > 1 ? 's' : ''} in Dubai`,
        html,
      })
    } catch (err) {
      console.error(`[email] Failed to send to ${sub.email}:`, err)
    }
  }

  console.log(`[email] Sent alerts to ${subscribers.length} subscribers`)
}
