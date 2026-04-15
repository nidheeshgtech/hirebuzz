'use client'

import { useState } from 'react'

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

const SOURCE_COLORS: Record<string, string> = {
  indeed: '#2164f3',
  adzuna: '#ef4444',
  bayt: '#0ea5e9',
  gulftalent: '#8b5cf6',
  naukrigulf: '#f97316',
}

const SOURCE_LABELS: Record<string, string> = {
  indeed: 'Indeed',
  adzuna: 'Adzuna',
  bayt: 'Bayt',
  gulftalent: 'GulfTalent',
  naukrigulf: 'NaukriGulf',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false)
  const sourceColor = SOURCE_COLORS[job.source] || 'var(--blue)'
  const sourceLabel = SOURCE_LABELS[job.source] || job.source

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--gray-200)',
      borderRadius: 10,
      marginBottom: 12,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Card header — always visible */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ padding: '14px 16px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{
                background: sourceColor + '20',
                color: sourceColor,
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 99,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {sourceLabel}
              </span>
              <span style={{ color: 'var(--gray-500)', fontSize: 12 }}>
                {timeAgo(job.created_at)}
              </span>
            </div>
            <h3 style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--gray-900)',
              marginBottom: 3,
              lineHeight: 1.3,
            }}>
              {job.title}
            </h3>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              🏢 {job.company} &nbsp;·&nbsp; 📍 {job.location}
            </div>
          </div>
          <div style={{
            fontSize: 18,
            color: 'var(--gray-500)',
            flexShrink: 0,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}>
            ▾
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--gray-100)',
          padding: '14px 16px',
          background: 'var(--gray-50)',
        }}>
          {job.description && (
            <p style={{
              fontSize: 14,
              color: 'var(--gray-700)',
              lineHeight: 1.6,
              marginBottom: 14,
              whiteSpace: 'pre-line',
            }}>
              {job.description}
            </p>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'var(--blue)',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            View &amp; Apply →
          </a>
        </div>
      )}
    </div>
  )
}
