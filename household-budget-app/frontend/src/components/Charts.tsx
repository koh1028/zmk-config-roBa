import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { getTransactions, getSummary, getManualExpenses } from '../api/client'
import type { Transaction, ManualExpense } from '../types'
import { CATEGORY_COLORS } from '../types'

const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`
const fmtM = (n: number) => `¥${(n / 10000).toFixed(1)}万`

function TrendIcon({ change }: { change: number }) {
  if (change > 5) return <TrendingUp className="text-red-500" size={16} />
  if (change < -5) return <TrendingDown className="text-green-500" size={16} />
  return <Minus className="text-gray-400" size={16} />
}

export default function Charts() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTransactions({ year }),
      getManualExpenses(),
    ]).then(([txs, manual]) => {
      setTransactions(txs)
      setManualExpenses(manual)
    }).finally(() => setLoading(false))
  }, [year])

  // Monthly totals by month
  const monthlyMap: Record<string, number> = {}
  for (const tx of transactions) {
    const m = tx.date.slice(0, 7)
    monthlyMap[m] = (monthlyMap[m] ?? 0) + tx.amount
  }
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`
    return { month: `${i + 1}月`, total: monthlyMap[m] ?? 0, key: m }
  })

  // Monthly fixed cost
  const fixedMonthly = manualExpenses.filter(e => e.is_recurring).reduce((s, e) => s + e.amount, 0)
  const monthlyWithFixed = monthlyData.map(d => ({
    ...d,
    credit: d.total,
    fixed: fixedMonthly,
    grandTotal: d.total + fixedMonthly,
  }))

  // Category breakdown (all year)
  const catMap: Record<string, number> = {}
  for (const tx of transactions) {
    catMap[tx.category] = (catMap[tx.category] ?? 0) + tx.amount
  }
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Category by month (stacked)
  const categories = Object.keys(catMap)
  const catMonthly = monthlyData.map(d => {
    const row: Record<string, number | string> = { month: d.month }
    for (const cat of categories) {
      row[cat] = transactions
        .filter(tx => tx.date.slice(0, 7) === d.key && tx.category === cat)
        .reduce((s, tx) => s + tx.amount, 0)
    }
    return row
  })

  // Month-over-month change
  const mom = monthlyData.map((d, i) => {
    const prev = i > 0 ? monthlyData[i - 1].total : null
    const change = prev && prev > 0 ? ((d.total - prev) / prev) * 100 : 0
    return { ...d, change, prev }
  })

  // Radar data (average monthly by category)
  const radarData = catData.slice(0, 6).map(d => ({
    category: d.name,
    月平均: Math.round(d.value / 12),
  }))

  // Top 10 high-spend merchants
  const merchantMap: Record<string, number> = {}
  for (const tx of transactions) {
    merchantMap[tx.description] = (merchantMap[tx.description] ?? 0) + tx.amount
  }
  const topMerchants = Object.entries(merchantMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  const yearTotal = transactions.reduce((s, t) => s + t.amount, 0)
  const monthsWithData = monthlyData.filter(d => d.total > 0).length
  const avgMonthly = monthsWithData > 0 ? yearTotal / monthsWithData : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">グラフ分析</h2>
        <select
          className="input w-auto"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
        >
          {[now.getFullYear() - 1, now.getFullYear()].map(y => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-400">データを読み込んでいます...</div>
      )}

      {!loading && transactions.length === 0 && (
        <div className="card text-center py-12">
          <AlertCircle className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500">データがありません</p>
          <p className="text-sm text-gray-400 mt-1">PDFを取り込むとグラフが表示されます</p>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '年間合計（クレジット）', value: fmt(yearTotal) },
              { label: '月平均支出', value: fmt(Math.round(avgMonthly)) },
              { label: '固定費/月', value: fmt(fixedMonthly) },
            ].map(item => (
              <div key={item.label} className="card">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Monthly total (credit + fixed) */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">月別支出（クレジット＋固定費）</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyWithFixed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="credit" name="クレジット" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fixed" name="固定費" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category stacked by month */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">月別カテゴリ内訳</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {categories.map(cat => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    name={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#94a3b8'}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">カテゴリ別支出割合</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={catData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0.05 ? `${name}\n${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {catData.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {catData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: CATEGORY_COLORS[d.name as keyof typeof CATEGORY_COLORS] ?? '#94a3b8' }}
                      />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">{((d.value / yearTotal) * 100).toFixed(1)}%</span>
                      <span className="font-medium w-24 text-right">{fmt(d.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar */}
            {radarData.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">カテゴリ別月平均（レーダー）</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fontSize: 9 }} tickFormatter={v => fmtM(v)} />
                    <Radar name="月平均" dataKey="月平均" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Month-over-month change */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">前月比（支出変化）</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mom.filter(d => d.total > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}%`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Line
                  type="monotone"
                  dataKey="change"
                  name="前月比"
                  stroke="#f97316"
                  dot={{ r: 4 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mom.filter(d => d.total > 0).map(d => (
                <div key={d.month} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                  <span className="text-gray-500">{d.month}</span>
                  <div className="flex items-center gap-1">
                    <TrendIcon change={d.change} />
                    <span className={d.change > 5 ? 'text-red-500' : d.change < -5 ? 'text-green-500' : 'text-gray-500'}>
                      {d.change > 0 ? '+' : ''}{d.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top merchants */}
          {topMerchants.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">支出の多い店舗・サービス TOP10</h3>
              <div className="space-y-2">
                {topMerchants.map((m, i) => {
                  const pct = (m.total / (topMerchants[0]?.total ?? 1)) * 100
                  return (
                    <div key={m.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 flex-shrink-0 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm truncate text-gray-700">{m.name}</span>
                          <span className="text-sm font-medium ml-2 flex-shrink-0">{fmt(m.total)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
