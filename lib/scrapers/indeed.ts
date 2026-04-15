import * as cheerio from 'cheerio'
import type { ScrapedJob } from './bayt'

// Indeed RSS feed — free, no API key needed
export async function scrapeIndeed(): Promise<ScrapedJob[]> {
  const queries = [
    'biology+teacher',
    'science+teacher+biology',
    'biology+educator',
  ]

  const allJobs: ScrapedJob[] = []

  for (const query of queries) {
    try {
      const url = `https://www.indeed.com/rss?q=${query}&l=Dubai%2C+United+Arab+Emirates&sort=date&radius=25`

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; RSS reader)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) {
        console.warn(`[indeed] HTTP ${res.status} for query "${query}"`)
        continue
      }

      const xml = await res.text()
      const $ = cheerio.load(xml, { xmlMode: true })

      $('item').each((_, el) => {
        const title = $(el).find('title').first().text().trim()
        const link = $(el).find('link').first().text().trim() ||
                     $(el).find('guid').first().text().trim()
        const description = $(el).find('description').first().text()
          .replace(/<[^>]*>/g, '') // strip HTML tags
          .trim()
          .slice(0, 400)

        // Extract company from description or source tag
        const source = $(el).find('source').first().text().trim()

        if (title && link && title.toLowerCase().includes('bio')) {
          allJobs.push({
            title,
            company: source || 'See listing',
            location: 'Dubai, UAE',
            description,
            url: link,
            source: 'indeed',
          })
        }
      })

      console.log(`[indeed] Query "${query}": found ${allJobs.length} total so far`)
    } catch (err) {
      console.warn(`[indeed] Query "${query}" failed:`, err)
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  const unique = allJobs.filter((j) => {
    if (seen.has(j.url)) return false
    seen.add(j.url)
    return true
  })

  console.log(`[indeed] Total unique jobs: ${unique.length}`)
  return unique
}
