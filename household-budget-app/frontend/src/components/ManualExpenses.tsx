import { useEffect, useState } from 'react'
import { PlusCircle, Pencil, Trash2, Check, X } from 'lucide-react'
import { getManualExpenses, createManualExpense, updateManualExpense, deleteManualExpense } from '../api/client'
import type { ManualExpense, ExpenseCategory } from '../types'
import { CATEGORIES, CATEGORY_COLORS } from '../types'

const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`

const EMPTY: ManualExpense = {
  name: '',
  amount: 0,
  category: 'その他',
  day_of_month: 1,
  is_recurring: true,
  start_date: '',
  end_date: '',
}

function ExpenseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ManualExpense
  onSave: (e: ManualExpense) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<ManualExpense>(initial)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ManualExpense>(k: K, v: ManualExpense[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || form.amount <= 0) return
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card border-2 border-blue-100 space-y-4">
      <h3 className="font-semibold text-gray-800">
        {initial.id ? '固定費を編集' : '固定費を追加'}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">名称 *</label>
          <input
            className="input"
            placeholder="例: 家賃、電気代"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">金額（円）*</label>
          <input
            className="input"
            type="number"
            min={1}
            value={form.amount || ''}
            onChange={e => set('amount', Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="label">カテゴリ</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value as ExpenseCategory)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">引き落とし日</label>
          <input
            className="input"
            type="number"
            min={1}
            max={31}
            value={form.day_of_month}
            onChange={e => set('day_of_month', Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            id="recurring"
            checked={form.is_recurring}
            onChange={e => set('is_recurring', e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <label htmlFor="recurring" className="text-sm text-gray-700">毎月繰り返す</label>
        </div>
        {!form.is_recurring && (
          <>
            <div>
              <label className="label">開始日</label>
              <input
                className="input"
                type="date"
                value={form.start_date || ''}
                onChange={e => set('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">終了日</label>
              <input
                className="input"
                type="date"
                value={form.end_date || ''}
                onChange={e => set('end_date', e.target.value)}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" className="btn-secondary flex items-center gap-1" onClick={onCancel}>
          <X size={15} /> キャンセル
        </button>
        <button type="submit" className="btn-primary flex items-center gap-1" disabled={saving}>
          <Check size={15} /> {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

export default function ManualExpenses() {
  const [expenses, setExpenses] = useState<ManualExpense[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const load = () => getManualExpenses().then(setExpenses)
  useEffect(() => { load() }, [])

  const handleCreate = async (e: ManualExpense) => {
    const created = await createManualExpense(e)
    setExpenses(prev => [...prev, created])
    setShowForm(false)
  }

  const handleUpdate = async (e: ManualExpense) => {
    const updated = await updateManualExpense(editingId!, e)
    setExpenses(prev => prev.map(x => x.id === editingId ? updated : x))
    setEditingId(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この固定費を削除しますか？')) return
    await deleteManualExpense(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const monthlyTotal = expenses.filter(e => e.is_recurring).reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">固定費登録</h2>
          <p className="text-sm text-gray-500 mt-0.5">家賃・ローン・光熱費など毎月の固定支払いを管理</p>
        </div>
        {!showForm && (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => { setShowForm(true); setEditingId(null) }}
          >
            <PlusCircle size={17} /> 追加
          </button>
        )}
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <p className="text-sm text-blue-600 font-medium">毎月の固定費合計</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{fmt(monthlyTotal)}</p>
          <p className="text-xs text-blue-500 mt-1">毎月自動的に計上される費用</p>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <ExpenseForm
          initial={{ ...EMPTY }}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* List */}
      {expenses.length === 0 && !showForm ? (
        <div className="card text-center py-12">
          <PlusCircle className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">固定費が登録されていません</p>
          <p className="text-sm text-gray-400 mt-1">「追加」ボタンから登録してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map(expense => (
            <div key={expense.id}>
              {editingId === expense.id ? (
                <ExpenseForm
                  initial={expense}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div
                    className="w-2 h-12 rounded-full flex-shrink-0"
                    style={{ background: CATEGORY_COLORS[expense.category] ?? '#94a3b8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{expense.name}</p>
                      <span
                        className="badge text-xs"
                        style={{
                          background: (CATEGORY_COLORS[expense.category] ?? '#94a3b8') + '20',
                          color: CATEGORY_COLORS[expense.category] ?? '#94a3b8',
                        }}
                      >
                        {expense.category}
                      </span>
                      {expense.is_recurring && (
                        <span className="badge bg-green-50 text-green-700 text-xs">毎月</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      毎月{expense.day_of_month}日引き落とし
                      {!expense.is_recurring && expense.start_date && ` ／ ${expense.start_date}〜${expense.end_date || '未定'}`}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900 flex-shrink-0">{fmt(expense.amount)}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => setEditingId(expense.id!)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => handleDelete(expense.id!)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
