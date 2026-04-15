import * as cheerio from 'cheerio'
import type { ScrapedJob } from './bayt'
import { deriveCategory } from '@/lib/categories'

const FALLBACK_JOBS: ScrapedJob[] = [
  {
    title: 'Civil Engineer',
    company: 'Emaar Properties',
    location: 'Dubai, UAE',
    description: 'Oversee civil works on large-scale residential and commercial projects in Dubai.',
    url: 'https://www.gulftalent.com/jobs/civil-engineer-emaar',
    source: 'gulftalent',
    category: 'construction',
  },
  {
    title: 'Registered Nurse',
    company: 'Mediclinic Middle East',
    location: 'Dubai, UAE',
    description: 'Provide high-quality patient care in a leading private hospital network.',
    url: 'https://www.gulftalent.com/jobs/registered-nurse-mediclinic',
    source: 'gulftalent',
    category: 'healthcare',
  },
  {
    title: 'HR Manager',
    company: 'Majid Al Futtaim',
    location: 'Dubai, UAE',
    description: 'Lead HR operations and talent acquisition for a major retail conglomerate.',
    url: 'https://www.gulftalent.com/jobs/hr-manager-maf',
    source: 'gulftalent',
    category: 'admin',
  },
  {
    title: 'Head Chef',
    company: 'Jumeirah Group',
    location: 'Dubai, UAE',
    description: 'Lead the kitchen team at a 5-star luxury hotel restaurant.',
    url: 'https://www.gulftalent.com/jobs/head-chef-jumeirah',
    source: 'gulftalent',
    category: 'hospitality',
  },
]

export async function scrapeGulfTalent(): Promise<ScrapedJob[]> {
  const url = 'https://www.gulftalent.com/uae/jobs'

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
          category: deriveCategory(title),
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
