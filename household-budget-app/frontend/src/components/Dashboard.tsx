import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { TrendingUp, CreditCard, Home, AlertCircle } from 'lucide-react'
import { getSummary } from '../api/client'
import type { Summary } from '../types'
import { CATEGORY_COLORS } from '../types'

const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSummary(year, month)
      .then(setSummary)
      .catch(e => setError(e.message))
  }, [year, month])

  const pieData = summary
    ? Object.entries(summary.by_category)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <div className="flex items-center gap-2">
          <select
            className="input w-auto"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {[now.getFullYear() - 1, now.getFullYear()].map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            className="input w-auto"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="クレジット合計"
              value={fmt(summary.total_transactions)}
              icon={CreditCard}
              color="bg-blue-500"
            />
            <StatCard
              label="固定費合計"
              value={fmt(summary.manual_monthly)}
              icon={Home}
              color="bg-purple-500"
            />
            <StatCard
              label="今月の支出合計"
              value={fmt(summary.grand_total)}
              icon={TrendingUp}
              color="bg-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category breakdown */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">カテゴリ別支出</h3>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {pieData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ?? '#94a3b8'}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5">
                    {pieData
                      .sort((a, b) => b.value - a.value)
                      .map(d => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full inline-block"
                              style={{ background: CATEGORY_COLORS[d.name as keyof typeof CATEGORY_COLORS] ?? '#94a3b8' }}
                            />
                            <span className="text-gray-600">{d.name}</span>
                          </div>
                          <span className="font-medium">{fmt(d.value)}</span>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">データがありません</p>
              )}
            </div>

            {/* Monthly trend */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">月別支出推移</h3>
              {summary.monthly_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={summary.monthly_trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11 }}
                      tickFormatter={v => v.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                    <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={l => `${l}月`} />
                    <Bar dataKey="total" name="支出" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">データがありません</p>
              )}
            </div>
          </div>

          {/* Sources */}
          {summary.sources.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">カード別集計</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">カード名</th>
                      <th className="text-right py-2 text-gray-500 font-medium">件数</th>
                      <th className="text-right py-2 text-gray-500 font-medium">合計金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.sources.map(s => (
                      <tr key={s.source} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 font-medium">{s.source}</td>
                        <td className="py-2.5 text-right text-gray-600">{s.count}件</td>
                        <td className="py-2.5 text-right font-medium">{fmt(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
