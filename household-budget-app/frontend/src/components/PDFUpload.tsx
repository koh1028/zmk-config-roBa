import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, X } from 'lucide-react'
import { uploadPDF, deleteTransaction } from '../api/client'
import type { Transaction } from '../types'
import { CATEGORY_COLORS } from '../types'

interface UploadedFile {
  file: File
  sourceName: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  transactions: Transaction[]
  error?: string
}

const fmt = (n: number) => `¥${n.toLocaleString('ja-JP')}`

export default function PDFUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (newFiles: FileList) => {
    const items: UploadedFile[] = Array.from(newFiles)
      .filter(f => f.name.toLowerCase().endsWith('.pdf'))
      .map(f => ({
        file: f,
        sourceName: f.name.replace('.pdf', '').replace(/[_\-]/g, ' '),
        status: 'pending',
        transactions: [],
      }))
    setFiles(prev => [...prev, ...items])
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const uploadOne = async (idx: number) => {
    setFiles(prev =>
      prev.map((f, i) => i === idx ? { ...f, status: 'uploading', error: undefined } : f)
    )
    try {
      const item = files[idx]
      const txs = await uploadPDF(item.file, item.sourceName)
      setFiles(prev =>
        prev.map((f, i) => i === idx ? { ...f, status: 'done', transactions: txs } : f)
      )
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'アップロードに失敗しました'
      setFiles(prev =>
        prev.map((f, i) => i === idx ? { ...f, status: 'error', error: message } : f)
      )
    }
  }

  const uploadAll = () => {
    files.forEach((f, i) => {
      if (f.status === 'pending') uploadOne(i)
    })
  }

  const handleDeleteTx = async (fileIdx: number, txId: number) => {
    await deleteTransaction(txId)
    setFiles(prev =>
      prev.map((f, i) =>
        i === fileIdx
          ? { ...f, transactions: f.transactions.filter(t => t.id !== txId) }
          : f
      )
    )
  }

  const pendingCount = files.filter(f => f.status === 'pending').length

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">PDFファイル取込</h2>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <Upload className="mx-auto mb-3 text-gray-400" size={40} />
        <p className="text-gray-600 font-medium">PDFをドラッグ＆ドロップ</p>
        <p className="text-sm text-gray-400 mt-1">またはクリックしてファイルを選択</p>
        <p className="text-xs text-gray-400 mt-2">
          楽天カード・三井住友カード・JCB・イオンカード等に対応
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{files.length}件のファイル</p>
            {pendingCount > 0 && (
              <button className="btn-primary" onClick={uploadAll}>
                すべてアップロード ({pendingCount}件)
              </button>
            )}
          </div>

          <div className="space-y-4">
            {files.map((item, idx) => (
              <div key={idx} className="card space-y-3">
                {/* File header */}
                <div className="flex items-start gap-3">
                  <FileText className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.file.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(item.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === 'done' && <CheckCircle className="text-green-500" size={18} />}
                    {item.status === 'error' && <AlertCircle className="text-red-500" size={18} />}
                    <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-gray-600">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Source name input */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="label">カード名（識別用）</label>
                    <input
                      className="input"
                      value={item.sourceName}
                      onChange={e => setFiles(prev =>
                        prev.map((f, i) => i === idx ? { ...f, sourceName: e.target.value } : f)
                      )}
                      disabled={item.status !== 'pending'}
                    />
                  </div>
                  {item.status === 'pending' && (
                    <div className="flex-shrink-0 mt-5">
                      <button className="btn-primary" onClick={() => uploadOne(idx)}>
                        解析する
                      </button>
                    </div>
                  )}
                  {item.status === 'uploading' && (
                    <div className="flex-shrink-0 mt-5">
                      <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        解析中...
                      </div>
                    </div>
                  )}
                </div>

                {/* Error */}
                {item.status === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                    <AlertCircle size={14} />
                    {item.error}
                  </div>
                )}

                {/* Transactions */}
                {item.transactions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">
                      ✓ {item.transactions.length}件の取引を取込みました
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">日付</th>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">内容</th>
                            <th className="text-left px-3 py-2 text-gray-500 font-medium">カテゴリ</th>
                            <th className="text-right px-3 py-2 text-gray-500 font-medium">金額</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.transactions.map(tx => (
                            <tr key={tx.id} className="border-t border-gray-50 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-500">{tx.date}</td>
                              <td className="px-3 py-2 max-w-xs truncate">{tx.description}</td>
                              <td className="px-3 py-2">
                                <span
                                  className="badge"
                                  style={{
                                    background: (CATEGORY_COLORS[tx.category] ?? '#94a3b8') + '20',
                                    color: CATEGORY_COLORS[tx.category] ?? '#94a3b8',
                                  }}
                                >
                                  {tx.category}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-medium">{fmt(tx.amount)}</td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => handleDeleteTx(idx, tx.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
