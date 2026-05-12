import { useEffect, useState } from 'react'
import { PlusCircle, Pencil, Trash2, Play, Check, X } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import { getDebts, createDebt, updateDebt, deleteDebt, simulate } from '../api/client'
import type { Debt, SimulationResult } from '../types'

const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`
const fmtM = (n: number) => `¥${(n / 10000).toFixed(1)}万`

const EMPTY_DEBT: Debt = {
  name: '',
  principal: 0,
  interest_rate: 0,
  monthly_payment: 0,
  start_date: new Date().toISOString().slice(0, 10),
}

function DebtForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Debt
  onSave: (d: Debt) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<Debt>(initial)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Debt>(k: K, v: Debt[K]) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="card border-2 border-blue-100 space-y-4">
      <h3 className="font-semibold text-gray-800">{initial.id ? 'ローンを編集' : 'ローンを追加'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">ローン名 *</label>
          <input className="input" placeholder="例: 住宅ローン" value={form.name}
            onChange={e => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">残債額（円）*</label>
          <input className="input" type="number" min={1} value={form.principal || ''}
            onChange={e => set('principal', Number(e.target.value))} required />
        </div>
        <div>
          <label className="label">年利（%）</label>
          <input className="input" type="number" min={0} step={0.01} value={form.interest_rate || ''}
            onChange={e => set('interest_rate', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">月々の返済額（円）*</label>
          <input className="input" type="number" min={1} value={form.monthly_payment || ''}
            onChange={e => set('monthly_payment', Number(e.target.value))} required />
        </div>
        <div>
          <label className="label">返済開始日</label>
          <input className="input" type="date" value={form.start_date}
            onChange={e => set('start_date', e.target.value)} />
        </div>
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

function SimulatorPanel({ debt }: { debt: Debt }) {
  const [bonusAmount, setBonusAmount] = useState(0)
  const [bonusMonths, setBonusMonths] = useState<number[]>([6, 12])
  const [extraMonthly, setExtraMonthly] = useState(0)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleBonusMonth = (m: number) => {
    setBonusMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await simulate({
        debt_id: debt.id!,
        bonus_amount: bonusAmount,
        bonus_months: bonusMonths,
        extra_monthly: extraMonthly,
      })
      setResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Sample data for chart (every 6 months)
  const chartData = result
    ? result.schedule.filter((_, i) => i % 3 === 0 || i === result.schedule.length - 1)
    : []

  return (
    <div className="space-y-4 mt-4 border-t border-gray-100 pt-4">
      <h4 className="font-medium text-gray-700">返済シミュレーション設定</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">毎月の追加返済（円）</label>
          <input className="input" type="number" min={0} value={extraMonthly || ''}
            onChange={e => setExtraMonthly(Number(e.target.value))}
            placeholder="0" />
        </div>
        <div>
          <label className="label">ボーナス返済額（円）</label>
          <input className="input" type="number" min={0} value={bonusAmount || ''}
            onChange={e => setBonusAmount(Number(e.target.value))}
            placeholder="0" />
        </div>
        <div>
          <label className="label">ボーナス月</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => toggleBonusMonth(m)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  bonusMonths.includes(m)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                }`}
              >
                {m}月
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          className="btn-primary flex items-center gap-2"
          onClick={run}
          disabled={loading}
        >
          <Play size={15} />
          {loading ? '計算中...' : 'シミュレーション実行'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '完済予定', value: result.payoff_date.replace('-', '年') + '月' },
              { label: '返済期間', value: `${result.months_count}ヶ月（${(result.months_count / 12).toFixed(1)}年）` },
              { label: '総返済額', value: fmtM(result.total_paid) },
              { label: '利息総額', value: fmtM(result.total_interest) },
            ].map(item => (
              <div key={item.label} className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-500">{item.label}</p>
                <p className="font-bold text-blue-800 text-sm mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card">
            <h4 className="font-medium text-gray-700 mb-3">残債推移</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(2)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  formatter={(v: number) => fmt(v)}
                  labelFormatter={l => `${l}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="remaining_balance"
                  name="残債"
                  stroke="#3b82f6"
                  fill="url(#balGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly breakdown chart */}
          <div className="card">
            <h4 className="font-medium text-gray-700 mb-3">元本・利息内訳</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(2)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}千`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Line type="monotone" dataKey="principal_paid" name="元本返済" stroke="#3b82f6" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="interest_paid" name="利息" stroke="#f97316" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Schedule table (first 12 months) */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h4 className="font-medium text-gray-700">返済スケジュール（最初の12ヶ月）</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['月', '返済額', '元本', '利息', '残債'].map(h => (
                      <th key={h} className="text-right px-4 py-2 text-gray-500 font-medium first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.slice(0, 12).map((row, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600">{row.month}</td>
                      <td className="px-4 py-2 text-right">{fmt(row.monthly_payment)}</td>
                      <td className="px-4 py-2 text-right text-blue-600">{fmt(row.principal_paid)}</td>
                      <td className="px-4 py-2 text-right text-orange-500">{fmt(row.interest_paid)}</td>
                      <td className="px-4 py-2 text-right font-medium">{fmt(row.remaining_balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DebtSimulator() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = () => getDebts().then(setDebts)
  useEffect(() => { load() }, [])

  const handleCreate = async (d: Debt) => {
    const created = await createDebt(d)
    setDebts(prev => [...prev, created])
    setShowForm(false)
  }

  const handleUpdate = async (d: Debt) => {
    const updated = await updateDebt(editingId!, d)
    setDebts(prev => prev.map(x => x.id === editingId ? updated : x))
    setEditingId(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('このローンを削除しますか？')) return
    await deleteDebt(id)
    setDebts(prev => prev.filter(d => d.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">返済シミュレーター</h2>
          <p className="text-sm text-gray-500 mt-0.5">ローン・借金の返済計画をシミュレーション</p>
        </div>
        {!showForm && (
          <button className="btn-primary flex items-center gap-2" onClick={() => { setShowForm(true); setEditingId(null) }}>
            <PlusCircle size={17} /> ローン追加
          </button>
        )}
      </div>

      {showForm && (
        <DebtForm initial={{ ...EMPTY_DEBT }} onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {debts.length === 0 && !showForm ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">ローンが登録されていません</p>
          <p className="text-sm text-gray-400 mt-1">「ローン追加」から登録してシミュレーションを実行してください</p>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map(debt => (
            <div key={debt.id} className="card">
              {editingId === debt.id ? (
                <DebtForm initial={debt} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{debt.name}</h3>
                        <span className="badge bg-orange-50 text-orange-600 text-xs">年利 {debt.interest_rate}%</span>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                        <span>残債: <strong className="text-gray-800">{fmt(debt.principal)}</strong></span>
                        <span>月返済: <strong className="text-gray-800">{fmt(debt.monthly_payment)}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-primary text-sm flex items-center gap-1"
                        onClick={() => setExpandedId(expandedId === debt.id ? null : debt.id!)}
                      >
                        <Play size={14} />
                        {expandedId === debt.id ? '閉じる' : 'シミュレーション'}
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                        onClick={() => setEditingId(debt.id!)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(debt.id!)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {expandedId === debt.id && <SimulatorPanel debt={debt} />}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
