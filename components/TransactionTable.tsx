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
      <div className="bg-gray-800 p-10 rounded-xl border border-dashed border-gray-700 text-center">
        <p className="text-gray-500">Belum ada transaksi. Ayo mulai DCA!</p>
      </div>
    )
  }

  return (
    <>
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900/50 text-gray-400 uppercase text-[10px] tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">Exchange</th>
              <th className="px-6 py-4">Modal (IDR)</th>
              <th className="px-6 py-4">BTC Didapat</th>
              <th className="px-6 py-4">Fee</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-700/30 transition-all">
                <td className="px-6 py-4 text-gray-300">
                  {new Date(tx.purchase_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-900 px-2 py-1 rounded text-[11px] border border-gray-700">
                    {tx.exchange_name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold">
                  Rp {tx.fiat_amount.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-orange-400 font-mono">
                  {tx.btc_amount.toFixed(8)}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  Rp {tx.fee.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                        {/* Tombol Edit */}
                        <button 
                        onClick={() => setSelectedTx(tx)}
                        className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors group"
                        >
                        <span className="text-orange-500 group-hover:scale-110 inline-block">✏️</span>
                        </button>

                        {/* Tombol Hapus */}
                        <button 
                        onClick={() => handleDelete(tx.id)}
                        disabled={isDeleting === tx.id}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus">
                        <span className={`${isDeleting === tx.id ? 'animate-pulse' : ''}`}>
                          {isDeleting === tx.id ? '⏳' : '🗑️'}
                        </span>
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
      <div className="flex items-center justify-between px-2 text-xs">
        <p className="text-gray-500">
          Menampilkan <span className="text-gray-300 font-bold">{transactions.length}</span> dari <span className="text-gray-300 font-bold">{totalCount}</span> transaksi
        </p>
        
        <div className="flex gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-all"
          >
            ← Prev
          </button>
          
          <div className="flex items-center px-4 bg-gray-900 border border-gray-700 rounded-lg font-bold text-orange-500">
            {currentPage} / {totalPages || 1}
          </div>

          <button 
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-all"
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