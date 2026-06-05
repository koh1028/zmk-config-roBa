'use client'

import { useEffect, useState } from 'react'
import { format, parseISO, isToday, isTomorrow, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarEvent, AccountType } from '@/types'

function parseDate(e: CalendarEvent) {
  return e.start.dateTime ? parseISO(e.start.dateTime) : parseISO(e.start.date!)
}

function groupByDay(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {}
  for (const e of events) {
    const d = startOfDay(parseDate(e)).toISOString()
    if (!groups[d]) groups[d] = []
    groups[d].push(e)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

function dayLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return '今日'
  if (isTomorrow(d)) return '明日'
  return format(d, 'M/d (E)', { locale: ja })
}

interface Props { account: AccountType }

export default function CalendarWidget({ account }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/google/calendar?account=${account}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.error === 'work_not_connected') setError('work_not_connected')
          else setError(data.error)
        } else {
          setEvents(data.events || [])
        }
      })
      .catch(() => setError('network_error'))
      .finally(() => setLoading(false))
  }, [account])

  const groups = groupByDay(events)

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span style={{ color: 'var(--green)' }}>◆</span>
        &nbsp;Calendar
        <span className="tag">{account}</span>
      </div>
      <div className="panel-body" style={{ fontSize: '12px' }}>
        {loading && <Spinner />}
        {error === 'work_not_connected' && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
            <div>仕事アカウント未連携</div>
            <a
              href="/api/auth/google-second/login"
              style={{
                color: 'var(--blue)',
                textDecoration: 'none',
                fontSize: '11px',
                display: 'inline-block',
                marginTop: '8px',
                padding: '4px 10px',
                border: '1px solid var(--blue)',
                borderRadius: '4px',
              }}
            >
              + 連携する
            </a>
          </div>
        )}
        {error && error !== 'work_not_connected' && (
          <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{error}</div>
        )}
        {!loading && !error && groups.length === 0 && (
          <div style={{ color: 'var(--muted)', textAlign: 'center', paddingTop: '20px' }}>
            予定なし
          </div>
        )}
        {!loading && !error &&
          groups.map(([dayIso, evts]) => (
            <div key={dayIso} style={{ marginBottom: '12px' }}>
              <div
                style={{
                  color: isToday(parseISO(dayIso)) ? 'var(--green)' : 'var(--muted)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {dayLabel(dayIso)}
              </div>
              {evts.map((e) => {
                const start = parseDate(e)
                const isAllDay = !e.start.dateTime
                return (
                  <a
                    key={e.id}
                    href={e.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'var(--text)',
                      marginBottom: '2px',
                      background: 'var(--surface2)',
                    }}
                  >
                    <span style={{ color: 'var(--cyan)', minWidth: '40px', fontSize: '11px' }}>
                      {isAllDay ? '終日' : format(start, 'HH:mm')}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.summary || '(タイトルなし)'}
                    </span>
                  </a>
                )
              })}
            </div>
          ))}
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
