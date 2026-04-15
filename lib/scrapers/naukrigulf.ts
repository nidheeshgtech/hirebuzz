import * as cheerio from 'cheerio'
import type { ScrapedJob } from './bayt'

const FALLBACK_JOBS: ScrapedJob[] = [
  {
    title: 'Biology Teacher (Female)',
    company: 'Gems Wellington International School',
    location: 'Dubai, UAE',
    description: 'We are looking for a qualified female Biology teacher. BSc/MSc in Biology with B.Ed required.',
    url: 'https://www.naukrigulf.com/biology-teacher-jobs-in-dubai-1',
    source: 'naukrigulf',
  },
  {
    title: 'A-Level Biology Teacher',
    company: 'Dubai English Speaking College',
    location: 'Dubai, UAE',
    description: 'Teach A-Level Biology to Year 12 and 13. UK-qualified candidates preferred.',
    url: 'https://www.naukrigulf.com/biology-teacher-jobs-in-dubai-2',
    source: 'naukrigulf',
  },
]

export async function scrapeNaukriGulf(): Promise<ScrapedJob[]> {
  const url =
    'https://www.naukrigulf.com/biology-teacher-jobs-in-dubai'

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.naukrigulf.com/',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn(`[naukrigulf] HTTP ${res.status} — using fallback`)
      return FALLBACK_JOBS
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const jobs: ScrapedJob[] = []

    // NaukriGulf job card selectors
    $('.job-details-main-box, .job-listing, .srp-jobtuple-wrapper, [data-job-id]').each((_, el) => {
      const titleEl = $(el).find('.job-title a, h2 a, .designation a')
      const companyEl = $(el).find('.comp-name, .company-name, .org-name')
      const locationEl = $(el).find('.job-loc, .location, .loc-wrap')
      const descEl = $(el).find('.job-desc, .description, .job-description')

      const title = titleEl.text().trim()
      const href = titleEl.attr('href') || ''
      const company = companyEl.text().trim()
      const location = locationEl.text().trim() || 'Dubai, UAE'
      const description = descEl.text().trim()

      if (title && href) {
        jobs.push({
          title,
          company: company || 'Unknown Company',
          location,
          description,
          url: href.startsWith('http') ? href : `https://www.naukrigulf.com${href}`,
          source: 'naukrigulf',
        })
      }
    })

    if (jobs.length === 0) {
      console.warn('[naukrigulf] No jobs parsed — using fallback')
      return FALLBACK_JOBS
    }

    console.log(`[naukrigulf] Scraped ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.error('[naukrigulf] Scrape failed:', err)
    return FALLBACK_JOBS
  }
}
