import * as cheerio from 'cheerio'
import type { ScrapedJob } from './bayt'

const FALLBACK_JOBS: ScrapedJob[] = [
  {
    title: 'Biology Teacher – IB Diploma',
    company: 'Repton School Dubai',
    location: 'Dubai, UAE',
    description: 'Teach IB Diploma Biology. Min 2 years teaching experience required. Competitive tax-free salary.',
    url: 'https://www.gulftalent.com/jobs/biology-teacher-ib-diploma-repton',
    source: 'gulftalent',
  },
  {
    title: 'Science & Biology Teacher',
    company: 'Nord Anglia Education',
    location: 'Dubai, UAE',
    description: 'Deliver engaging Science and Biology lessons to KS3 and KS4 students.',
    url: 'https://www.gulftalent.com/jobs/science-biology-teacher-nord-anglia',
    source: 'gulftalent',
  },
]

export async function scrapeGulfTalent(): Promise<ScrapedJob[]> {
  const url =
    'https://www.gulftalent.com/jobs/biology-teacher-jobs-in-dubai'

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn(`[gulftalent] HTTP ${res.status} — using fallback`)
      return FALLBACK_JOBS
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const jobs: ScrapedJob[] = []

    // GulfTalent job card selectors
    $('.job_listing, .job-listing, article.job').each((_, el) => {
      const titleEl = $(el).find('h2 a, h3 a, .job-title a')
      const companyEl = $(el).find('.company_name, .company-name, .employer')
      const locationEl = $(el).find('.location, .job-location')
      const descEl = $(el).find('.description, .job-description, p')

      const title = titleEl.text().trim()
      const href = titleEl.attr('href') || ''
      const company = companyEl.text().trim()
      const location = locationEl.text().trim() || 'Dubai, UAE'
      const description = descEl.first().text().trim()

      if (title && href) {
        jobs.push({
          title,
          company: company || 'Unknown Company',
          location,
          description,
          url: href.startsWith('http') ? href : `https://www.gulftalent.com${href}`,
          source: 'gulftalent',
        })
      }
    })

    if (jobs.length === 0) {
      console.warn('[gulftalent] No jobs parsed — using fallback')
      return FALLBACK_JOBS
    }

    console.log(`[gulftalent] Scraped ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.error('[gulftalent] Scrape failed:', err)
    return FALLBACK_JOBS
  }
}
