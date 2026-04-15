import { NextResponse } from 'next/server'
import { initDB, insertJob, getNewJobsSince } from '@/lib/db'
import { scrapeBayt } from '@/lib/scrapers/bayt'
import { scrapeGulfTalent } from '@/lib/scrapers/gulftalent'
import { scrapeNaukriGulf } from '@/lib/scrapers/naukrigulf'
import { sendPushNotifications, sendEmailAlerts } from '@/lib/notify'

export const maxDuration = 60 // seconds

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this automatically; manual calls must include it)
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date()
  console.log('[scrape] Starting job scrape at', startedAt.toISOString())

  try {
    // Ensure tables exist
    await initDB()

    // Run all scrapers concurrently
    const [baytJobs, gulfJobs, naukriJobs] = await Promise.allSettled([
      scrapeBayt(),
      scrapeGulfTalent(),
      scrapeNaukriGulf(),
    ])

    const allJobs = [
      ...(baytJobs.status === 'fulfilled' ? baytJobs.value : []),
      ...(gulfJobs.status === 'fulfilled' ? gulfJobs.value : []),
      ...(naukriJobs.status === 'fulfilled' ? naukriJobs.value : []),
    ]

    console.log(`[scrape] Total jobs scraped: ${allJobs.length}`)

    // Insert into DB (skips duplicates via ON CONFLICT DO NOTHING)
    let inserted = 0
    for (const job of allJobs) {
      const ok = await insertJob(job)
      if (ok) inserted++
    }

    console.log(`[scrape] New jobs inserted: ${inserted}`)

    // Only notify if new jobs were found
    if (inserted > 0) {
      const newJobs = await getNewJobsSince(startedAt)
      await Promise.allSettled([
        sendPushNotifications(newJobs),
        sendEmailAlerts(newJobs),
      ])
    }

    return NextResponse.json({
      ok: true,
      scraped: allJobs.length,
      inserted,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[scrape] Error:', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
