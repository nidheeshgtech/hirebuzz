'use client'

import { useEffect, useState, useCallback } from 'react'
import JobCard from '@/components/JobCard'
import JobFilters from '@/components/JobFilters'
import NotificationPanel from '@/components/NotificationPanel'

type Job = {
  id: number
  title: string
  company: string
  location: string
  description: string | null
  url: string
  source: string
  posted_at: string
  created_at: string
}

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filtered, setFiltered] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState('')

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/jobs')
      if (!res.ok) throw new Error('Failed to load jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
      setFiltered(data.jobs || [])
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
    // Refresh every 5 minutes
    const interval = setInterval(fetchJobs, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchJobs])

  const handleScrapeNow = async () => {
    setScraping(true)
    setScrapeMsg('')
    try {
      const res = await fetch('/api/scrape', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setScrapeMsg(`Done! Found ${data.scraped} jobs, ${data.inserted} new.`)
        await fetchJobs()
      } else {
        setScrapeMsg('Scrape failed: ' + data.error)
      }
    } catch {
      setScrapeMsg('Network error during scrape.')
    } finally {
      setScraping(false)
    }
  }

  const sources = [...new Set(jobs.map((j) => j.source))]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--blue)',
        color: '#fff',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700 }}>🐝 HireBuzz</span>
            <span style={{
              marginLeft: 8,
              fontSize: 12,
              background: 'rgba(255,255,255,0.2)',
              padding: '2px 8px',
              borderRadius: 12,
            }}>
              Dubai Biology Teachers
            </span>
          </div>
          <button
            onClick={() => setShowNotifPanel(true)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            🔔 Alerts
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
          color: '#fff',
          borderRadius: 12,
          padding: '24px 20px',
          marginBottom: 24,
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Biology Teacher Jobs in Dubai
          </h1>
          <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 16 }}>
            Scraped hourly from Bayt, GulfTalent &amp; NaukriGulf. Get instant alerts when new jobs appear.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
            }}>
              📋 <strong>{jobs.length}</strong> jobs listed
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
            }}>
              🏢 <strong>{[...new Set(jobs.map((j) => j.company))].length}</strong> companies
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
            }}>
              🔄 Updated hourly
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            {lastUpdated && `Last refreshed: ${lastUpdated}`}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={fetchJobs}
              style={{
                background: 'var(--gray-100)',
                border: '1px solid var(--gray-200)',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 13,
                color: 'var(--gray-700)',
              }}
            >
              ↺ Refresh
            </button>
            <button
              onClick={handleScrapeNow}
              disabled={scraping}
              style={{
                background: scraping ? 'var(--gray-200)' : 'var(--blue)',
                color: scraping ? 'var(--gray-500)' : '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {scraping ? '⏳ Scraping…' : '⚡ Scrape Now'}
            </button>
          </div>
        </div>

        {scrapeMsg && (
          <div style={{
            background: scrapeMsg.includes('failed') || scrapeMsg.includes('error')
              ? '#fee2e2' : '#dcfce7',
            color: scrapeMsg.includes('failed') || scrapeMsg.includes('error')
              ? 'var(--red)' : 'var(--green)',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}>
            {scrapeMsg}
          </div>
        )}

        {/* Filters */}
        <JobFilters jobs={jobs} sources={sources} onFilter={setFiltered} />

        {/* Job list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>Loading jobs…</p>
          </div>
        ) : error ? (
          <div style={{
            background: '#fee2e2',
            color: 'var(--red)',
            padding: 16,
            borderRadius: 8,
            textAlign: 'center',
          }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray-500)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 600 }}>No jobs found</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>Try adjusting your filters or click &quot;Scrape Now&quot;</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
              Showing {filtered.length} job{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>

      {/* Notification panel */}
      {showNotifPanel && (
        <NotificationPanel onClose={() => setShowNotifPanel(false)} />
      )}
    </div>
  )
}
