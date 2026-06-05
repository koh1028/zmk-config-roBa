import { NextRequest, NextResponse } from 'next/server'
import { fetchMemos, createMemo } from '@/lib/notion'

export async function GET() {
  try {
    const memos = await fetchMemos()
    return NextResponse.json({ memos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, tags } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const memo = await createMemo(title.trim(), tags || [])
    return NextResponse.json({ memo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
