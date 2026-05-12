import { useEffect, useState } from 'react'
import { Search, Trash2, RefreshCw } from 'lucide-react'
import { getTransactions, updateTransactionCategory, deleteTransaction } from '../api/client'
import type { Transaction, ExpenseCategory } from '../types'
import { CATEGORIES, CATEGORY_COLORS } from '../types'

const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`

export default function Transactions() {
  const now = new Date()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(0) // 0 = all
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getTransactions({
        year: year || undefined,
        month: month || undefined,
        category: category || undefined,
      })
      setTransactions(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [year, month, category])

  const filtered = search
    ? transactions.filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.source.toLowerCase().includes(search.toLowerCase())
      )
    : transactions

  const handleCategoryChange = async (id: number, cat: ExpenseCategory) => {
    await updateTransactionCategory(id, cat)
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: cat } : t))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この取引を削除しますか？')) return
    await deleteTransaction(id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const total = filtered.reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">取引一覧</h2>
        <button className="btn-secondary flex items-center gap-2" onClick={load}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          更新
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">年</label>
            <select className="input" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[now.getFullYear() - 1, now.getFullYear()].map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">月</label>
            <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              <option value={0}>すべて</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">カテゴリ</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">すべて</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">検索</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8"
                placeholder="店名・内容"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{filtered.length}件</span>
        <span className="font-semibold text-gray-900">合計: {fmt(total)}</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">日付</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">内容</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">カード</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">カテゴリ</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">金額</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">読み込み中...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    取引データがありません。PDFを取り込んでください。
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="block truncate" title={tx.description}>{tx.description}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="badge bg-gray-100 text-gray-600">{tx.source}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={tx.category}
                        onChange={e => handleCategoryChange(tx.id, e.target.value as ExpenseCategory)}
                        style={{ color: CATEGORY_COLORS[tx.category] ?? '#94a3b8' }}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
