import { NextRequest, NextResponse } from 'next/server'
import { fetchDiaryEntries, createDiaryEntry } from '@/lib/notion'

export async function GET() {
  try {
    const entries = await fetchDiaryEntries()
    return NextResponse.json({ entries })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, date } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const today = date || new Date().toISOString().split('T')[0]
    const entry = await createDiaryEntry(title.trim(), today)
    return NextResponse.json({ entry })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
