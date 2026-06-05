'use client'

import { useEffect, useState } from 'react'
import { GmailMessage, AccountType } from '@/types'

function parseFrom(from: string) {
  const match = from.match(/^"?([^"<]+)"?\s*<(.+)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: from, email: from }
}

function relativeTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return '今'
    if (m < 60) return `${m}分前`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}時間前`
    return `${Math.floor(h / 24)}日前`
  } catch {
    return ''
  }
}

interface Props { account: AccountType }

export default function GmailWidget({ account }: Props) {
  const [messages, setMessages] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/google/gmail?account=${account}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setMessages(data.messages || [])
      })
      .catch(() => setError('network_error'))
      .finally(() => setLoading(false))
  }, [account])

  const gmailUrl =
    account === 'personal'
      ? 'https://mail.google.com/mail/u/0/'
      : 'https://mail.google.com/mail/u/1/'

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span style={{ color: 'var(--blue)' }}>◆</span>
        &nbsp;Gmail
        {!loading && !error && (
          <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: '11px' }}>
            {messages.length > 0 ? `${messages.length} 未読` : ''}
          </span>
        )}
        <a
          href={gmailUrl}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--muted)', fontSize: '10px', textDecoration: 'none' }}
        >
          開く →
        </a>
      </div>
      <div className="panel-body">
        {loading && <Spinner />}
        {error === 'work_not_connected' && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px 0', fontSize: '12px' }}>
            <div>仕事アカウント未連携</div>
            <a
              href="/api/auth/google-second/login"
              style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: '11px' }}
            >
              + 連携する
            </a>
          </div>
        )}
        {error && error !== 'work_not_connected' && (
          <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{error}</div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: '20px', fontSize: '12px' }}>
            未読メールなし
          </div>
        )}
        {!loading &&
          !error &&
          messages.map((msg) => {
            const { name } = parseFrom(msg.from)
            return (
              <div
                key={msg.id}
                className="fade-in"
                style={{
                  borderBottom: '1px solid var(--border)',
                  padding: '6px 0',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {name}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '10px', flexShrink: 0 }}>
                    {relativeTime(msg.date)}
                  </span>
                </div>
                <div style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>
                  {msg.subject}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {msg.snippet}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: '20px', fontSize: '11px' }}>
      <span className="blink">_</span> loading...
    </div>
  )
}
