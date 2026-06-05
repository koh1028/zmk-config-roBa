import { google } from 'googleapis'
import { GmailMessage, CalendarEvent } from '@/types'

function makeAuth(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ access_token: accessToken })
  return auth
}

export async function fetchCalendarEvents(accessToken: string): Promise<CalendarEvent[]> {
  const auth = makeAuth(accessToken)
  const calendar = google.calendar({ version: 'v3', auth })

  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: weekLater.toISOString(),
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (res.data.items || []) as CalendarEvent[]
}

export async function fetchGmailMessages(accessToken: string): Promise<GmailMessage[]> {
  const auth = makeAuth(accessToken)
  const gmail = google.gmail({ version: 'v1', auth })

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread in:inbox',
    maxResults: 15,
  })

  const messages = listRes.data.messages || []
  if (messages.length === 0) return []

  const full = await Promise.all(
    messages.map((msg) =>
      gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      })
    )
  )

  return full.map((res) => {
    const headers = res.data.payload?.headers || []
    const get = (name: string) => headers.find((h) => h.name === name)?.value || ''
    const from = get('From')
    const nameMatch = from.match(/^"?([^"<]+)"?\s*</)
    return {
      id: res.data.id!,
      from,
      fromName: nameMatch ? nameMatch[1].trim() : from.replace(/<.*>/, '').trim(),
      subject: get('Subject') || '(件名なし)',
      date: get('Date'),
      snippet: res.data.snippet || '',
      isUnread: res.data.labelIds?.includes('UNREAD') ?? false,
    }
  })
}
