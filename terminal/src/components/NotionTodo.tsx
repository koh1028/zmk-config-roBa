'use client'

import { useEffect, useState, KeyboardEvent } from 'react'
import { NotionTodo } from '@/types'

const PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--red)',
  medium: 'var(--yellow)',
  low: 'var(--muted)',
}

export default function NotionTodoWidget() {
  const [todos, setTodos] = useState<NotionTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/notion/todos')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setTodos(d.todos || [])
      })
      .catch(() => setError('network_error'))
      .finally(() => setLoading(false))
  }, [])

  async function addTodo() {
    const title = input.trim()
    if (!title) return
    setInput('')
    const res = await fetch('/api/notion/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const data = await res.json()
    if (data.todo) setTodos([data.todo, ...todos])
  }

  async function toggle(todo: NotionTodo) {
    setTodos(todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))
    await fetch('/api/notion/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todo.id, done: !todo.done }),
    })
    if (!todo.done) {
      setTimeout(() => setTodos((prev) => prev.filter((t) => t.id !== todo.id)), 600)
    }
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo()
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span style={{ color: 'var(--purple)' }}>◆</span>
        &nbsp;TODO
        <span style={{ color: 'var(--muted)', fontSize: '10px' }}>
          {!loading && `${todos.length}件`}
        </span>
      </div>
      <div className="panel-body" style={{ maxHeight: '220px' }}>
        {/* Input */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="新しいTODOを追加..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            style={{ flex: 1, fontSize: '12px' }}
          />
          <button
            onClick={addTodo}
            style={{ background: 'var(--purple)', color: '#000', fontWeight: 600, padding: '4px 8px' }}
          >
            +
          </button>
        </div>

        {loading && <div style={{ color: 'var(--muted)', fontSize: '11px' }}><span className="blink">_</span> loading...</div>}
        {error && <div style={{ color: 'var(--red)', fontSize: '11px' }}>Error: {error}</div>}

        {!loading && !error && todos.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: '11px', textAlign: 'center', padding: '8px 0' }}>
            完了! すべてのTODOが片付きました
          </div>
        )}

        {todos.map((todo) => (
          <div
            key={todo.id}
            className="fade-in"
            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}
          >
            <button
              onClick={() => toggle(todo)}
              style={{
                width: '16px',
                height: '16px',
                border: `1px solid ${todo.priority ? PRIORITY_COLOR[todo.priority] : 'var(--border)'}`,
                borderRadius: '3px',
                background: todo.done ? 'var(--green)' : 'transparent',
                color: 'var(--green)',
                fontSize: '10px',
                padding: 0,
                flexShrink: 0,
                marginTop: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {todo.done && '✓'}
            </button>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <span
                style={{
                  color: todo.done ? 'var(--muted)' : 'var(--text)',
                  textDecoration: todo.done ? 'line-through' : 'none',
                  fontSize: '12px',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {todo.title}
              </span>
              <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                {todo.priority && (
                  <span style={{ fontSize: '9px', color: PRIORITY_COLOR[todo.priority] }}>
                    {todo.priority}
                  </span>
                )}
                {todo.dueDate && (
                  <span style={{ fontSize: '9px', color: 'var(--muted)' }}>
                    期限: {todo.dueDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
