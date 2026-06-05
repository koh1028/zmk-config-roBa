'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { AccountType, SecondAccountInfo } from '@/types'
import CalendarWidget from '@/components/CalendarWidget'
import GmailWidget from '@/components/GmailWidget'
import BookmarksWidget from '@/components/BookmarksWidget'
import NotionTodoWidget from '@/components/NotionTodo'
import NotionDiaryWidget from '@/components/NotionDiary'
import NotionMemoWidget from '@/components/NotionMemo'

function LoginScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        background: 'var(--bg)',
      }}
    >
      <pre
        style={{
          color: 'var(--green)',
          fontSize: '13px',
          lineHeight: '1.4',
          textAlign: 'center',
          margin: 0,
        }}
      >
        {`
██████╗  ██████╗ ██████╗  █████╗
██╔══██╗██╔═══██╗██╔══██╗██╔══██╗
██████╔╝██║   ██║██████╔╝███████║
██╔══██╗██║   ██║██╔══██╗██╔══██║
██║  ██║╚██████╔╝██████╔╝██║  ██║
╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝
        `.trim()}
      </pre>
      <div style={{ color: 'var(--muted)', fontSize: '12px', letterSpacing: '0.2em' }}>
        PERSONAL TERMINAL v1.0
      </div>
      <button
        onClick={() => signIn('google')}
        style={{
          background: 'var(--green)',
          color: '#000',
          fontWeight: 700,
          padding: '10px 28px',
          fontSize: '13px',
          letterSpacing: '0.1em',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        &gt; Google でログイン
      </button>
      <div style={{ color: 'var(--border)', fontSize: '11px' }}>
        <span className="blink">_</span>
      </div>
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.05em' }}>
        {time}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{date}</div>
    </div>
  )
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [account, setAccount] = useState<AccountType>('personal')
  const [workInfo, setWorkInfo] = useState<SecondAccountInfo | null>(null)

  useEffect(() => {
    const raw = document.cookie
      .split('; ')
      .find((r) => r.startsWith('g_work_info='))
      ?.split('=')
      .slice(1)
      .join('=')
    if (raw) {
      try {
        setWorkInfo(JSON.parse(decodeURIComponent(raw)))
      } catch {
        setWorkInfo(null)
      }
    }
  }, [])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        <span className="blink">_</span>&nbsp;initializing...
      </div>
    )
  }

  if (!session) return <LoginScreen />

  const personalName = session.user?.name || session.user?.email || 'Personal'
  const personalEmail = session.user?.email || ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green)', letterSpacing: '0.1em' }}>
          &gt; TERMINAL
        </div>

        {/* Account switcher */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setAccount('personal')}
            style={{
              background: account === 'personal' ? 'var(--green)' : 'var(--surface2)',
              color: account === 'personal' ? '#000' : 'var(--muted)',
              border: `1px solid ${account === 'personal' ? 'var(--green)' : 'var(--border)'}`,
              padding: '3px 10px',
              fontSize: '11px',
              borderRadius: '4px',
              fontWeight: account === 'personal' ? 700 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {session.user?.image && (
              <img src={session.user.image} alt="" width={14} height={14} style={{ borderRadius: '50%' }} />
            )}
            {personalName.split(' ')[0]}
            <span style={{ fontSize: '9px', opacity: 0.7 }}>(personal)</span>
          </button>

          {workInfo ? (
            <button
              onClick={() => setAccount('work')}
              style={{
                background: account === 'work' ? 'var(--orange)' : 'var(--surface2)',
                color: account === 'work' ? '#000' : 'var(--muted)',
                border: `1px solid ${account === 'work' ? 'var(--orange)' : 'var(--border)'}`,
                padding: '3px 10px',
                fontSize: '11px',
                borderRadius: '4px',
                fontWeight: account === 'work' ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {workInfo.picture && (
                <img src={workInfo.picture} alt="" width={14} height={14} style={{ borderRadius: '50%' }} />
              )}
              {workInfo.name?.split(' ')[0] || 'Work'}
              <span style={{ fontSize: '9px', opacity: 0.7 }}>(work)</span>
            </button>
          ) : (
            <a
              href="/api/auth/google-second/login"
              style={{
                background: 'var(--surface2)',
                color: 'var(--muted)',
                border: '1px dashed var(--border)',
                padding: '3px 10px',
                fontSize: '11px',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              + 仕事アカウント追加
            </a>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Status */}
        <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--green)' }}>●</span>
          {personalEmail}
        </div>

        <Clock />

        <button
          onClick={() => signOut()}
          style={{
            background: 'transparent',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            padding: '3px 8px',
            fontSize: '11px',
            borderRadius: '4px',
          }}
        >
          logout
        </button>
      </header>

      {/* Main grid */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '12px 16px',
          minHeight: 0,
        }}
      >
        {/* Column 1: Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <CalendarWidget account={account} />
        </div>

        {/* Column 2: Gmail */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <GmailWidget account={account} />
        </div>

        {/* Column 3: Bookmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <BookmarksWidget account={account} />
        </div>

        {/* Column 4: Notion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
          <NotionTodoWidget />
          <NotionDiaryWidget />
          <NotionMemoWidget />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '4px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--border)',
          flexShrink: 0,
        }}
      >
        <span>personal-terminal v1.0.0</span>
        <span>
          account:{' '}
          <span style={{ color: account === 'personal' ? 'var(--green)' : 'var(--orange)' }}>
            {account}
          </span>
          <span className="blink" style={{ marginLeft: '4px' }}>
            _
          </span>
        </span>
      </footer>
    </div>
  )
}
