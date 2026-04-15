import type { ScrapedJob } from './bayt'
import { deriveCategory } from '@/lib/categories'

// Adzuna Job API — free tier, 250 req/month
// Register at: https://developer.adzuna.com/

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

const QUERIES = [
  'teacher educator',
  'engineer developer',
  'doctor nurse',
  'accountant finance',
  'marketing sales',
]

export async function scrapeAdzuna(): Promise<ScrapedJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    console.warn('[adzuna] ADZUNA_APP_ID or ADZUNA_APP_KEY not set — skipping')
    return []
  }

  const allJobs: ScrapedJob[] = []

  for (const what of QUERIES) {
    try {
      const params = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        what,
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
        console.warn(`[adzuna] HTTP ${res.status} for query "${what}"`)
        continue
      }

      const data: AdzunaResponse = await res.json()
      for (const job of data.results || []) {
        allJobs.push({
          title: job.title,
          company: job.company?.display_name || 'Unknown Company',
          location: job.location?.display_name || 'Dubai, UAE',
          description: job.description?.slice(0, 500) || '',
          url: job.redirect_url,
          source: 'adzuna',
          category: deriveCategory(job.title),
        })
      }

      console.log(`[adzuna] Query "${what}": ${allJobs.length} total so far`)
    } catch (err) {
      console.warn(`[adzuna] Query "${what}" failed:`, err)
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allJobs.filter((j) => {
    if (seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })

  console.log(`[adzuna] Total unique jobs: ${unique.length}`)
  return unique
}
