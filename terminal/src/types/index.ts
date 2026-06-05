export type AccountType = 'personal' | 'work'

export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  htmlLink: string
  colorId?: string
}

export interface GmailMessage {
  id: string
  from: string
  fromName: string
  subject: string
  date: string
  snippet: string
  isUnread: boolean
}

export interface Bookmark {
  id: string
  title: string
  url: string
  category: string
  account: AccountType | 'shared'
  createdAt: string
}

export interface NotionTodo {
  id: string
  title: string
  done: boolean
  priority: 'high' | 'medium' | 'low' | null
  dueDate?: string | null
}

export interface NotionDiaryEntry {
  id: string
  title: string
  date: string
  url: string
}

export interface NotionMemo {
  id: string
  title: string
  tags: string[]
  updatedAt: string
  url: string
}

export interface SecondAccountInfo {
  email: string
  name: string
  picture?: string
}
