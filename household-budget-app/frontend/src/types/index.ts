export type ExpenseCategory =
  | '食費'
  | '交通費'
  | '光熱費・通信'
  | '娯楽'
  | 'ショッピング'
  | '医療'
  | '保険'
  | '家賃'
  | 'ローン・返済'
  | 'その他'

export const CATEGORIES: ExpenseCategory[] = [
  '食費', '交通費', '光熱費・通信', '娯楽', 'ショッピング',
  '医療', '保険', '家賃', 'ローン・返済', 'その他',
]

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  '食費': '#f97316',
  '交通費': '#3b82f6',
  '光熱費・通信': '#8b5cf6',
  '娯楽': '#ec4899',
  'ショッピング': '#14b8a6',
  '医療': '#ef4444',
  '保険': '#f59e0b',
  '家賃': '#6366f1',
  'ローン・返済': '#84cc16',
  'その他': '#94a3b8',
}

export interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  category: ExpenseCategory
  source: string
  is_manual: boolean
}

export interface ManualExpense {
  id?: number
  name: string
  amount: number
  category: ExpenseCategory
  day_of_month: number
  is_recurring: boolean
  start_date?: string
  end_date?: string
}

export interface Debt {
  id?: number
  name: string
  principal: number
  interest_rate: number
  monthly_payment: number
  start_date: string
}

export interface SimulationParams {
  debt_id: number
  bonus_amount: number
  bonus_months: number[]
  extra_monthly: number
}

export interface MonthlySimPoint {
  month: string
  remaining_balance: number
  monthly_payment: number
  interest_paid: number
  principal_paid: number
}

export interface SimulationResult {
  schedule: MonthlySimPoint[]
  total_interest: number
  payoff_date: string
  total_paid: number
  months_count: number
}

export interface Summary {
  year: number
  month: number
  total_transactions: number
  manual_monthly: number
  grand_total: number
  by_category: Record<string, number>
  monthly_trend: { month: string; total: number }[]
  sources: { source: string; count: number; total: number }[]
}
