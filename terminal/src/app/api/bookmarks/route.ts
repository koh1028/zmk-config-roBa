import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { Bookmark } from '@/types'

const DATA_FILE = path.join(process.cwd(), 'data', 'bookmarks.json')

function load(): Bookmark[] {
  if (!fs.existsSync(DATA_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function save(bookmarks: Bookmark[]) {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(bookmarks, null, 2))
}

export async function GET() {
  return NextResponse.json({ bookmarks: load() })
}

export async function POST(req: NextRequest) {
  const { title, url, category, account } = await req.json()
  if (!url?.trim()) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const bookmarks = load()
  const bookmark: Bookmark = {
    id: Date.now().toString(),
    title: title?.trim() || url,
    url: url.trim(),
    category: category?.trim() || 'general',
    account: account || 'shared',
    createdAt: new Date().toISOString(),
  }
  bookmarks.unshift(bookmark)
  save(bookmarks)
  return NextResponse.json({ bookmark })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const bookmarks = load().filter((b) => b.id !== id)
  save(bookmarks)
  return NextResponse.json({ ok: true })
}
