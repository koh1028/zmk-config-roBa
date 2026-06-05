'use client'

import { useEffect, useState } from 'react'
import { NotionDiaryEntry } from '@/types'

export default function NotionDiaryWidget() {
  const [entries, setEntries] = useState<NotionDiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const todayEntry = entries.find((e) => e.date === today)

  useEffect(() => {
    fetch('/api/notion/diary')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setEntries(d.entries || [])
      })
      .catch(() => setError('network_error'))
      .finally(() => setLoading(false))
  }, [])

  async function create() {
    const t = title.trim() || `日記 ${today}`
    setCreating(true)
    const res = await fetch('/api/notion/diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, date: today }),
    })
    const data = await res.json()
    if (data.entry) {
      setEntries([data.entry, ...entries])
      setTitle('')
      window.open(data.entry.url, '_blank')
    }
    setCreating(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${m}/${d}`
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span style={{ color: 'var(--orange)' }}>◆</span>
        &nbsp;日記
      </div>
      <div className="panel-body" style={{ maxHeight: '200px' }}>
        {loading && <div style={{ color: 'var(--muted)', fontSize: '11px' }}><span className="blink">_</span> loading...</div>}
        {error && <div style={{ color: 'var(--red)', fontSize: '11px' }}>Error: {error}</div>}

        {/* Today's entry or create button */}
        {!loading && !error && (
          <div style={{ marginBottom: '10px' }}>
            {todayEntry ? (
              <a
                href={todayEntry.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  background: 'var(--surface2)',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: 'var(--orange)',
                  fontSize: '12px',
                  border: '1px solid var(--orange)',
                }}
              >
                <span>✏️</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {todayEntry.title}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>今日</span>
              </a>
            ) : (
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  placeholder={`今日の日記タイトル (${today})`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && create()}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button
                  onClick={create}
                  disabled={creating}
                  style={{ background: 'var(--orange)', color: '#000', fontWeight: 600, padding: '4px 8px' }}
                >
                  {creating ? '...' : '+'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent entries */}
        {!loading &&
          !error &&
          entries
            .filter((e) => e.date !== today)
            .slice(0, 7)
            .map((entry) => (
              <a
                key={entry.id}
                href={entry.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '3px 4px',
                  borderRadius: '3px',
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontSize: '12px',
                  marginBottom: '2px',
                }}
              >
                <span style={{ color: 'var(--muted)', fontSize: '10px', minWidth: '28px' }}>
                  {formatDate(entry.date)}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {entry.title}
                </span>
              </a>
            ))}
      </div>
    </div>
  )
}
