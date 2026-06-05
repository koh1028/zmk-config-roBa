'use client'

import { useEffect, useState } from 'react'
import { NotionMemo } from '@/types'

export default function NotionMemoWidget() {
  const [memos, setMemos] = useState<NotionMemo[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/notion/memos')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setMemos(d.memos || [])
      })
      .catch(() => setError('network_error'))
      .finally(() => setLoading(false))
  }, [])

  async function createMemo() {
    if (!title.trim()) return
    setCreating(true)
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const res = await fetch('/api/notion/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), tags: tagList }),
    })
    const data = await res.json()
    if (data.memo) {
      setMemos([data.memo, ...memos])
      setTitle('')
      setTags('')
      window.open(data.memo.url, '_blank')
    }
    setCreating(false)
  }

  const filtered = memos.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  function relativeDate(iso: string) {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return '今日'
    if (days === 1) return '昨日'
    if (days < 7) return `${days}日前`
    return `${Math.floor(days / 7)}週間前`
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span style={{ color: 'var(--cyan)' }}>◆</span>
        &nbsp;メモ
        <span style={{ color: 'var(--muted)', fontSize: '10px' }}>{!loading && `${memos.length}件`}</span>
      </div>
      <div className="panel-body" style={{ maxHeight: '240px' }}>
        {/* New memo form */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          <input
            type="text"
            placeholder="メモタイトル..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createMemo()}
            style={{ flex: 2, fontSize: '12px' }}
          />
          <input
            type="text"
            placeholder="タグ(カンマ区切り)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ flex: 1, fontSize: '11px' }}
          />
          <button
            onClick={createMemo}
            disabled={creating || !title.trim()}
            style={{ background: 'var(--cyan)', color: '#000', fontWeight: 600, padding: '4px 8px', flexShrink: 0 }}
          >
            {creating ? '...' : '+'}
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: '8px', fontSize: '11px' }}
        />

        {loading && <div style={{ color: 'var(--muted)', fontSize: '11px' }}><span className="blink">_</span> loading...</div>}
        {error && <div style={{ color: 'var(--red)', fontSize: '11px' }}>Error: {error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '8px 0', fontSize: '11px' }}>
            {search ? '検索結果なし' : 'メモなし'}
          </div>
        )}

        {filtered.map((memo) => (
          <a
            key={memo.id}
            href={memo.url}
            target="_blank"
            rel="noreferrer"
            className="fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 6px',
              marginBottom: '2px',
              borderRadius: '4px',
              background: 'var(--surface2)',
              textDecoration: 'none',
              color: 'var(--text)',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {memo.title}
              </div>
              {memo.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '3px', marginTop: '2px', flexWrap: 'wrap' }}>
                  {memo.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="tag" style={{ color: 'var(--cyan)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span style={{ color: 'var(--muted)', fontSize: '10px', flexShrink: 0 }}>
              {relativeDate(memo.updatedAt)}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
