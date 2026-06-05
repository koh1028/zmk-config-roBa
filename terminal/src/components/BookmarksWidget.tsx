'use client'

import { useEffect, useState } from 'react'
import { Bookmark, AccountType } from '@/types'

const STORAGE_KEY = 'personal_terminal_bookmarks'

function loadBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveBookmarks(bookmarks: Bookmark[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

interface Props { account: AccountType }

export default function BookmarksWidget({ account }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [adding, setAdding] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [filter, setFilter] = useState<'all' | AccountType>('all')

  useEffect(() => {
    setBookmarks(loadBookmarks())
  }, [])

  const filtered = bookmarks.filter(
    (b) => filter === 'all' || b.account === filter || b.account === 'shared'
  )
  const categories = Array.from(new Set(filtered.map((b) => b.category)))

  function add() {
    if (!url.trim()) return
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      title: title.trim() || url.trim(),
      url: url.trim(),
      category: category.trim() || 'general',
      account,
      createdAt: new Date().toISOString(),
    }
    const updated = [bookmark, ...bookmarks]
    setBookmarks(updated)
    saveBookmarks(updated)
    setUrl('')
    setTitle('')
    setCategory('')
    setAdding(false)
  }

  function remove(id: string) {
    const updated = bookmarks.filter((b) => b.id !== id)
    setBookmarks(updated)
    saveBookmarks(updated)
  }

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span style={{ color: 'var(--yellow)' }}>◆</span>
        &nbsp;Bookmarks
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'personal', 'work'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '1px 6px',
                fontSize: '9px',
                background: filter === f ? 'var(--yellow)' : 'var(--surface)',
                color: filter === f ? '#000' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-body" style={{ fontSize: '12px' }}>
        {adding ? (
          <div className="fade-in" style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              placeholder="URL (例: https://github.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              style={{ width: '100%' }}
              autoFocus
            />
            <input
              type="text"
              placeholder="タイトル (省略可)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%' }}
            />
            <input
              type="text"
              placeholder="カテゴリ (例: 仕事, ツール)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={add} style={{ background: 'var(--yellow)', color: '#000', flex: 1 }}>
                追加
              </button>
              <button onClick={() => setAdding(false)} style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{ background: 'var(--surface2)', color: 'var(--muted)', width: '100%', marginBottom: '10px', border: '1px dashed var(--border)' }}
          >
            + ブックマークを追加
          </button>
        )}

        {filtered.length === 0 && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: '12px' }}>
            ブックマークなし
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: '12px' }}>
            <div style={{ color: 'var(--muted)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {cat}
            </div>
            {filtered
              .filter((b) => b.category === cat)
              .map((b) => {
                let hostname = ''
                try { hostname = new URL(b.url).hostname } catch {}
                return (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', padding: '3px 6px', background: 'var(--surface2)', borderRadius: '4px' }}>
                    {hostname && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
                        alt="" width={14} height={14}
                        style={{ flexShrink: 0 }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <a
                      href={b.url} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--text)', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {b.title}
                    </a>
                    <span style={{ fontSize: '9px', color: b.account === 'work' ? 'var(--orange)' : 'var(--cyan)', flexShrink: 0 }}>
                      {b.account !== 'shared' ? b.account : ''}
                    </span>
                    <button
                      onClick={() => remove(b.id)}
                      style={{ background: 'transparent', color: 'var(--border)', fontSize: '11px', padding: '0 2px', flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}
