import * as cheerio from 'cheerio'

export type ScrapedJob = {
  title: string
  company: string
  location: string
  description: string
  url: string
  source: string
}

const FALLBACK_JOBS: ScrapedJob[] = [
  {
    title: 'Biology Teacher',
    company: 'GEMS Education',
    location: 'Dubai, UAE',
    description: 'Seeking an experienced Biology teacher for secondary school. Must have a relevant degree and teaching qualification.',
    url: 'https://www.bayt.com/en/uae/jobs/biology-teacher-gems-education/',
    source: 'bayt',
  },
  {
    title: 'Secondary Biology Teacher',
    company: 'Taaleem Group',
    location: 'Dubai, UAE',
    description: 'Full-time Biology teacher position for academic year. IB experience preferred.',
    url: 'https://www.bayt.com/en/uae/jobs/secondary-biology-teacher-taaleem/',
    source: 'bayt',
  },
]

export async function scrapeBayt(): Promise<ScrapedJob[]> {
  const url =
    'https://www.bayt.com/en/uae/jobs/biology-teacher-jobs-in-dubai/'

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

    // Bayt job listing cards
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
