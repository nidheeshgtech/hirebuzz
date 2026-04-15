'use client'

import { useState, useEffect } from 'react'

type Job = {
  id: number
  title: string
  company: string
  location: string
  source: string
  posted_at: string
  created_at: string
  description: string | null
  url: string
}

type Props = {
  jobs: Job[]
  sources: string[]
  onFilter: (jobs: Job[]) => void
}

const SOURCE_LABELS: Record<string, string> = {
  bayt: 'Bayt',
  gulftalent: 'GulfTalent',
  naukrigulf: 'NaukriGulf',
}

export default function JobFilters({ jobs, sources, onFilter }: Props) {
  const [search, setSearch] = useState('')
  const [activeSource, setActiveSource] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'company'>('newest')

  useEffect(() => {
    let result = [...jobs]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.description || '').toLowerCase().includes(q)
      )
    }

    if (activeSource !== 'all') {
      result = result.filter((j) => j.source === activeSource)
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      result.sort((a, b) => a.company.localeCompare(b.company))
    }

    onFilter(result)
  }, [search, activeSource, sortBy, jobs, onFilter])

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--gray-200)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 16,
    }}>
      {/* Search */}
      <input
        type="search"
        placeholder="Search jobs, companies…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 14px',
          borderRadius: 8,
          border: '1px solid var(--gray-200)',
          fontSize: 14,
          marginBottom: 12,
          outline: 'none',
          background: 'var(--gray-50)',
        }}
      />

      {/* Source filter + sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterChip
            label="All Sources"
            active={activeSource === 'all'}
            onClick={() => setActiveSource('all')}
          />
          {sources.map((s) => (
            <FilterChip
              key={s}
              label={SOURCE_LABELS[s] || s}
              active={activeSource === s}
              onClick={() => setActiveSource(s)}
            />
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'company')}
          style={{
            padding: '6px 10px',
            borderRadius: 7,
            border: '1px solid var(--gray-200)',
            fontSize: 13,
            background: 'var(--gray-50)',
            color: 'var(--gray-700)',
          }}
        >
          <option value="newest">Newest first</option>
          <option value="company">By company</option>
        </select>
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px',
        borderRadius: 99,
        border: `1.5px solid ${active ? 'var(--blue)' : 'var(--gray-200)'}`,
        background: active ? 'var(--blue-light)' : 'transparent',
        color: active ? 'var(--blue)' : 'var(--gray-700)',
        fontSize: 12,
        fontWeight: active ? 700 : 400,
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}
