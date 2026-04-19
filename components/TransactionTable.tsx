'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import EditModal from './EditModal'

interface Transaction {
  id: string
  purchase_date: string
  exchange_name: string | null
  fiat_amount: number
  btc_amount: number
  fee: number
}

interface TableProps {
  transactions: Transaction[]
  onUpdate: () => void
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export default function TransactionTable({ 
  transactions, onUpdate, currentPage, totalCount, itemsPerPage, onPageChange 
}: TableProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Apakah kamu yakin ingin menghapus transaksi ini? Data yang dihapus tidak bisa dikembalikan.")
    
    if (confirmDelete) {
      setIsDeleting(id)
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        alert("Gagal menghapus: " + error.message)
      } else {
        onUpdate() // Refresh data dashboard & summary
      }
      setIsDeleting(null)
    }
  }

    if (transactions.length === 0) {
    return (
      <div className="card p-10 text-center" style={{ borderStyle: 'dashed' }}>
        <p style={{ color: 'var(--text-muted)' }}>Belum ada transaksi. Ayo mulai DCA!</p>
      </div>
    )
  }

  return (
    <>
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              <th className="px-6 py-4 text-[10px] tracking-widest font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Tanggal</th>
              <th className="px-6 py-4 text-[10px] tracking-widest font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Exchange</th>
              <th className="px-6 py-4 text-[10px] tracking-widest font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Modal (IDR)</th>
              <th className="px-6 py-4 text-[10px] tracking-widest font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>BTC Didapat</th>
              <th className="px-6 py-4 text-[10px] tracking-widest font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Fee</th>
              <th className="px-6 py-4 text-[10px] tracking-widest font-semibold uppercase text-center" style={{ color: 'var(--text-muted)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr 
                key={tx.id} 
                className="transition-colors"
                style={{ 
                  borderTop: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(tx.purchase_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4">
                  <span 
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                    style={{ 
                      background: 'var(--bg-elevated)', 
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {tx.exchange_name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Rp {tx.fiat_amount.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 font-mono" style={{ color: 'var(--accent)' }}>
                  {tx.btc_amount.toFixed(8)}
                </td>
                <td className="px-6 py-4" style={{ color: 'var(--text-muted)' }}>
                  Rp {tx.fee.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                        {/* Tombol Edit */}
                        <button 
                          onClick={() => setSelectedTx(tx)}
                          className="p-2 rounded-lg transition-colors cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-subtle)'
                            e.currentTarget.style.color = 'var(--accent)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-muted)'
                          }}
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>

                        {/* Tombol Hapus */}
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          disabled={isDeleting === tx.id}
                          className="p-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--red-subtle)'
                            e.currentTarget.style.color = 'var(--red)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'var(--text-muted)'
                          }}
                          title="Hapus"
                        >
                          {isDeleting === tx.id ? (
                            <div className="w-[15px] h-[15px] border-2 rounded-full animate-spin" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent' }} />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          )}
                        </button>
                      </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* KONTROL PAGINATION */}
      <div className="flex items-center justify-between px-1 py-3 text-xs">
        <p style={{ color: 'var(--text-muted)' }}>
          Menampilkan <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{transactions.length}</span> dari <span className="font-bold" style={{ color: 'var(--text-secondary)' }}>{totalCount}</span> transaksi
        </p>
        
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 cursor-pointer text-xs font-medium"
            style={{ 
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            ← Prev
          </button>
          
          <div 
            className="flex items-center px-4 rounded-lg font-bold text-xs"
            style={{ 
              background: 'var(--accent-subtle)',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
            }}
          >
            {currentPage} / {totalPages || 1}
          </div>

          <button 
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 cursor-pointer text-xs font-medium"
            style={{ 
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            Next →
          </button>
        </div>
      </div>
      
{/* Tampilkan Modal hanya jika ada transaksi yang dipilih */}
      {selectedTx && (
        <EditModal 
          transaction={selectedTx} 
          isOpen={!!selectedTx} 
          onClose={() => setSelectedTx(null)} 
          onSuccess={onUpdate}
        />
      )}
    </>
  )
}