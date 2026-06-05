import { NextRequest, NextResponse } from 'next/server'
import { fetchTodos, createTodo, toggleTodo } from '@/lib/notion'

export async function GET() {
  try {
    const todos = await fetchTodos()
    return NextResponse.json({ todos })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const todo = await createTodo(title.trim())
    return NextResponse.json({ todo })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, done } = await req.json()
    await toggleTodo(id, done)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
