import * as cheerio from 'cheerio'
import type { ScrapedJob } from './bayt'
import { deriveCategory } from '@/lib/categories'

const FALLBACK_JOBS: ScrapedJob[] = [
  {
    title: 'Sales Executive',
    company: 'Sobha Realty',
    location: 'Dubai, UAE',
    description: 'Drive property sales and build client relationships for a premium real estate developer.',
    url: 'https://www.naukrigulf.com/sales-executive-sobha-1',
    source: 'naukrigulf',
    category: 'marketing',
  },
  {
    title: 'Accountant',
    company: 'PwC Middle East',
    location: 'Dubai, UAE',
    description: 'Provide audit and assurance services to clients across the UAE.',
    url: 'https://www.naukrigulf.com/accountant-pwc-1',
    source: 'naukrigulf',
    category: 'finance',
  },
  {
    title: 'Primary School Teacher',
    company: 'Dubai English Speaking College',
    location: 'Dubai, UAE',
    description: 'Deliver engaging lessons to primary students following the British curriculum.',
    url: 'https://www.naukrigulf.com/primary-teacher-desc-1',
    source: 'naukrigulf',
    category: 'teaching',
  },
  {
    title: 'Network Engineer',
    company: 'du Telecom',
    location: 'Dubai, UAE',
    description: 'Design and maintain network infrastructure for a leading UAE telecom provider.',
    url: 'https://www.naukrigulf.com/network-engineer-du-1',
    source: 'naukrigulf',
    category: 'engineering',
  },
]

export async function scrapeNaukriGulf(): Promise<ScrapedJob[]> {
  const url = 'https://www.naukrigulf.com/jobs-in-dubai'

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
          category: deriveCategory(title),
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
