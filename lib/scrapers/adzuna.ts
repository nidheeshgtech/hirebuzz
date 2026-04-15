import type { ScrapedJob } from './bayt'

// Adzuna Job API — free tier, 250 req/month
// Register at: https://developer.adzuna.com/
// Covers UAE jobs from 100+ sources including Bayt, GulfTalent, NaukriGulf

type AdzunaJob = {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  description: string
  redirect_url: string
  created: string
}

type AdzunaResponse = {
  results: AdzunaJob[]
  count: number
}

export async function scrapeAdzuna(): Promise<ScrapedJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    console.warn('[adzuna] ADZUNA_APP_ID or ADZUNA_APP_KEY not set — skipping')
    return []
  }

  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: 'biology teacher',
      where: 'Dubai',
      results_per_page: '20',
      sort_by: 'date',
      content_type: 'application/json',
    })

    const url = `https://api.adzuna.com/v1/api/jobs/ae/search/1?${params}`

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      console.warn(`[adzuna] HTTP ${res.status}`)
      return []
    }

    const data: AdzunaResponse = await res.json()
    const jobs: ScrapedJob[] = (data.results || []).map((job) => ({
      title: job.title,
      company: job.company?.display_name || 'Unknown Company',
      location: job.location?.display_name || 'Dubai, UAE',
      description: job.description?.slice(0, 500) || '',
      url: job.redirect_url,
      source: 'adzuna',
    }))

    console.log(`[adzuna] Found ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.error('[adzuna] Error:', err)
    return []
  }
}
