import { Client } from '@notionhq/client'
import { NotionTodo, NotionDiaryEntry, NotionMemo } from '@/types'

function getClient() {
  return new Client({ auth: process.env.NOTION_API_KEY })
}

function strProp(page: any, name: string): string {
  const p = page.properties?.[name]
  if (!p) return ''
  if (p.type === 'title') return p.title?.[0]?.plain_text ?? ''
  if (p.type === 'rich_text') return p.rich_text?.[0]?.plain_text ?? ''
  if (p.type === 'select') return p.select?.name ?? ''
  if (p.type === 'date') return p.date?.start ?? ''
  if (p.type === 'checkbox') return p.checkbox ? 'true' : 'false'
  if (p.type === 'multi_select') return p.multi_select?.map((s: any) => s.name).join(',') ?? ''
  return ''
}

export async function fetchTodos(): Promise<NotionTodo[]> {
  const notion = getClient()
  const res = await notion.databases.query({
    database_id: process.env.NOTION_TODO_DB_ID!,
    filter: { property: 'Done', checkbox: { equals: false } },
    sorts: [{ property: 'Priority', direction: 'ascending' }],
    page_size: 50,
  })
  return res.results.map((page: any) => ({
    id: page.id,
    title: strProp(page, 'Name'),
    done: strProp(page, 'Done') === 'true',
    priority: (strProp(page, 'Priority') as NotionTodo['priority']) || null,
    dueDate: strProp(page, 'Due') || null,
  }))
}

export async function createTodo(title: string): Promise<NotionTodo> {
  const notion = getClient()
  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_TODO_DB_ID! },
    properties: {
      Name: { title: [{ text: { content: title } }] },
      Done: { checkbox: false },
    },
  }) as any
  return {
    id: page.id,
    title,
    done: false,
    priority: null,
    dueDate: null,
  }
}

export async function toggleTodo(id: string, done: boolean): Promise<void> {
  const notion = getClient()
  await notion.pages.update({
    page_id: id,
    properties: { Done: { checkbox: done } },
  })
}

export async function fetchDiaryEntries(): Promise<NotionDiaryEntry[]> {
  const notion = getClient()
  const res = await notion.databases.query({
    database_id: process.env.NOTION_DIARY_DB_ID!,
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: 10,
  })
  return res.results.map((page: any) => ({
    id: page.id,
    title: strProp(page, 'Title') || strProp(page, 'Name'),
    date: strProp(page, 'Date'),
    url: page.url,
  }))
}

export async function createDiaryEntry(title: string, date: string): Promise<NotionDiaryEntry> {
  const notion = getClient()
  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DIARY_DB_ID! },
    properties: {
      Title: { title: [{ text: { content: title } }] },
      Date: { date: { start: date } },
    },
  }) as any
  return { id: page.id, title, date, url: page.url }
}

export async function fetchMemos(): Promise<NotionMemo[]> {
  const notion = getClient()
  const res = await notion.databases.query({
    database_id: process.env.NOTION_MEMO_DB_ID!,
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 20,
  })
  return res.results.map((page: any) => ({
    id: page.id,
    title: strProp(page, 'Title') || strProp(page, 'Name'),
    tags: page.properties?.Tags?.multi_select?.map((s: any) => s.name) ?? [],
    updatedAt: page.last_edited_time,
    url: page.url,
  }))
}

export async function createMemo(title: string, tags: string[]): Promise<NotionMemo> {
  const notion = getClient()
  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_MEMO_DB_ID! },
    properties: {
      Title: { title: [{ text: { content: title } }] },
      Tags: { multi_select: tags.map((t) => ({ name: t })) },
    },
  }) as any
  return {
    id: page.id,
    title,
    tags,
    updatedAt: page.last_edited_time,
    url: page.url,
  }
}
