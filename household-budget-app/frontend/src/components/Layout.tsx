import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Upload, List, PlusCircle, TrendingDown, BarChart2
} from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'ダッシュボード' },
  { to: '/upload', icon: Upload, label: 'PDF取込' },
  { to: '/transactions', icon: List, label: '取引一覧' },
  { to: '/manual', icon: PlusCircle, label: '固定費登録' },
  { to: '/debt', icon: TrendingDown, label: '返済シミュレーター' },
  { to: '/charts', icon: BarChart2, label: 'グラフ分析' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-blue-600">家計簿</h1>
          <p className="text-xs text-gray-400 mt-0.5">スマート家計管理</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
