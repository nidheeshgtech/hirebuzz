import * as cheerio from 'cheerio'
import { deriveCategory } from '@/lib/categories'

export type ScrapedJob = {
  title: string
  company: string
  location: string
  description: string
  url: string
  source: string
  category: string
}

const FALLBACK_JOBS: ScrapedJob[] = [
  {
    title: 'Software Engineer',
    company: 'Careem',
    location: 'Dubai, UAE',
    description: 'Build scalable backend services for the region's leading super app.',
    url: 'https://www.bayt.com/en/uae/jobs/software-engineer-careem/',
    source: 'bayt',
    category: 'engineering',
  },
  {
    title: 'Secondary School Teacher',
    company: 'GEMS Education',
    location: 'Dubai, UAE',
    description: 'Seeking experienced teachers across all subjects for secondary school.',
    url: 'https://www.bayt.com/en/uae/jobs/secondary-teacher-gems/',
    source: 'bayt',
    category: 'teaching',
  },
  {
    title: 'Finance Manager',
    company: 'Emirates Group',
    location: 'Dubai, UAE',
    description: 'Manage financial reporting and treasury operations for a global airline group.',
    url: 'https://www.bayt.com/en/uae/jobs/finance-manager-emirates/',
    source: 'bayt',
    category: 'finance',
  },
  {
    title: 'Marketing Executive',
    company: 'Chalhoub Group',
    location: 'Dubai, UAE',
    description: 'Drive marketing campaigns for luxury retail brands across the UAE.',
    url: 'https://www.bayt.com/en/uae/jobs/marketing-executive-chalhoub/',
    source: 'bayt',
    category: 'marketing',
  },
]

export async function scrapeBayt(): Promise<ScrapedJob[]> {
  const url = 'https://www.bayt.com/en/uae/jobs/in-dubai/'

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.warn(`[bayt] HTTP ${res.status} — using fallback`)
      return FALLBACK_JOBS
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const jobs: ScrapedJob[] = []

    $('li[data-js-aid]').each((_, el) => {
      const titleEl = $(el).find('h2.jb-title a, [data-automation-id="job-title"] a')
      const companyEl = $(el).find('[data-automation-id="job-company"], .jb-comp-name')
      const locationEl = $(el).find('[data-automation-id="job-location"], .jb-loc')
      const descEl = $(el).find('[data-automation-id="job-description"], .jb-desc')

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
          url: href.startsWith('http') ? href : `https://www.bayt.com${href}`,
          source: 'bayt',
          category: deriveCategory(title),
        })
      }
    })

    if (jobs.length === 0) {
      console.warn('[bayt] No jobs parsed — using fallback')
      return FALLBACK_JOBS
    }

    console.log(`[bayt] Scraped ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.error('[bayt] Scrape failed:', err)
    return FALLBACK_JOBS
  }
}
