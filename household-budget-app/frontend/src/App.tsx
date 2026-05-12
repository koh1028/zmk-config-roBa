import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import PDFUpload from './components/PDFUpload'
import Transactions from './components/Transactions'
import ManualExpenses from './components/ManualExpenses'
import DebtSimulator from './components/DebtSimulator'
import Charts from './components/Charts'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<PDFUpload />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/manual" element={<ManualExpenses />} />
        <Route path="/debt" element={<DebtSimulator />} />
        <Route path="/charts" element={<Charts />} />
      </Route>
    </Routes>
  )
}
