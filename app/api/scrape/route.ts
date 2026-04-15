import { NextResponse } from 'next/server'
import { initDB, insertJob, getNewJobsSince } from '@/lib/db'
import { scrapeBayt } from '@/lib/scrapers/bayt'
import { scrapeGulfTalent } from '@/lib/scrapers/gulftalent'
import { scrapeNaukriGulf } from '@/lib/scrapers/naukrigulf'
import { scrapeIndeed } from '@/lib/scrapers/indeed'
import { scrapeAdzuna } from '@/lib/scrapers/adzuna'
import { sendPushNotifications, sendEmailAlerts } from '@/lib/notify'

export const maxDuration = 60 // seconds

// Manual scrape endpoint – called by the "Scrape Now" button in the UI.
// No CRON_SECRET required (this is intentionally open for manual triggers).
export async function POST() {
  const startedAt = new Date()
  console.log('[scrape] Manual scrape started at', startedAt.toISOString())

  try {
    await initDB()

    const [indeedJobs, adzunaJobs, baytJobs, gulfJobs, naukriJobs] = await Promise.allSettled([
      scrapeIndeed(),
      scrapeAdzuna(),
      scrapeBayt(),
      scrapeGulfTalent(),
      scrapeNaukriGulf(),
    ])

    const allJobs = [
      ...(indeedJobs.status === 'fulfilled' ? indeedJobs.value : []),
      ...(adzunaJobs.status === 'fulfilled' ? adzunaJobs.value : []),
      ...(baytJobs.status === 'fulfilled' ? baytJobs.value : []),
      ...(gulfJobs.status === 'fulfilled' ? gulfJobs.value : []),
      ...(naukriJobs.status === 'fulfilled' ? naukriJobs.value : []),
    ]

    console.log(`[scrape] Total jobs scraped: ${allJobs.length}`)

    let inserted = 0
    for (const job of allJobs) {
      const ok = await insertJob(job)
      if (ok) inserted++
    }

    console.log(`[scrape] New jobs inserted: ${inserted}`)

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
