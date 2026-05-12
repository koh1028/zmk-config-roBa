import type {
  Transaction, ManualExpense, Debt, SimulationParams, SimulationResult, Summary, ExpenseCategory
} from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'APIエラーが発生しました')
  }
  return res.json()
}

// Transactions
export const getTransactions = (params?: {
  year?: number; month?: number; category?: string; source?: string
}) => {
  const qs = new URLSearchParams()
  if (params?.year) qs.set('year', String(params.year))
  if (params?.month) qs.set('month', String(params.month))
  if (params?.category) qs.set('category', params.category)
  if (params?.source) qs.set('source', params.source)
  return request<Transaction[]>(`/transactions?${qs}`)
}

export const uploadPDF = (file: File, sourceName: string) => {
  const form = new FormData()
  form.append('file', file)
  const qs = new URLSearchParams({ source_name: sourceName })
  return request<Transaction[]>(`/transactions/upload?${qs}`, { method: 'POST', body: form })
}

export const updateTransactionCategory = (id: number, category: ExpenseCategory) =>
  request<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  })

export const deleteTransaction = (id: number) =>
  request<{ ok: boolean }>(`/transactions/${id}`, { method: 'DELETE' })

// Manual Expenses
export const getManualExpenses = () => request<ManualExpense[]>('/manual-expenses')

export const createManualExpense = (expense: ManualExpense) =>
  request<ManualExpense>('/manual-expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })

export const updateManualExpense = (id: number, expense: ManualExpense) =>
  request<ManualExpense>(`/manual-expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  })

export const deleteManualExpense = (id: number) =>
  request<{ ok: boolean }>(`/manual-expenses/${id}`, { method: 'DELETE' })

// Debts
export const getDebts = () => request<Debt[]>('/debts')

export const createDebt = (debt: Debt) =>
  request<Debt>('/debts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt),
  })

export const updateDebt = (id: number, debt: Debt) =>
  request<Debt>(`/debts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt),
  })

export const deleteDebt = (id: number) =>
  request<{ ok: boolean }>(`/debts/${id}`, { method: 'DELETE' })

// Simulation
export const simulate = (params: SimulationParams) =>
  request<SimulationResult>('/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

// Summary
export const getSummary = (year: number, month: number) =>
  request<Summary>(`/summary?year=${year}&month=${month}`)
