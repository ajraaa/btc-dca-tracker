'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Transaction {
  id: string
  purchase_date: string
  exchange_name: string | null
  fiat_amount: number
  btc_amount: number
  fee: number
}

interface EditModalProps {
  transaction: Transaction
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditModal({ transaction, isOpen, onClose, onSuccess }: EditModalProps) {
  const [fiatAmount, setFiatAmount] = useState(transaction.fiat_amount.toString())
  const [btcAmount, setBtcAmount] = useState(transaction.btc_amount.toString())
  const [fee, setFee] = useState(transaction.fee.toString()) // Sekarang akan dipakai
  const [date, setDate] = useState(transaction.purchase_date.split('T')[0])
  const [exchange, setExchange] = useState(transaction.exchange_name || '')
  const [loading, setLoading] = useState(false)
  const today = new Date().toLocaleDateString('en-CA');
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const fiat = parseFloat(fiatAmount)
    const btc = parseFloat(btcAmount)
    const feeVal = parseFloat(fee)

    if (date > today) {
      setErrorMsg("Tanggal tidak boleh lebih dari hari ini")
      setLoading(false)
      return
    }

    if (fiat <= 0) {
      setErrorMsg("Modal (IDR) harus lebih besar dari 0")
      setLoading(false)
      return
    }

    if (btc <= 0) {
      setErrorMsg("Jumlah BTC harus lebih besar dari 0")
      setLoading(false)
      return
    }

    if (feeVal < 0) {
      setErrorMsg("Biaya (Fee) tidak boleh negatif")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        fiat_amount: parseFloat(fiatAmount),
        btc_amount: parseFloat(btcAmount),
        fee: parseFloat(fee),
        purchase_date: new Date(date).toISOString(),
        exchange_name: exchange,
      })
      .eq('id', transaction.id)

    setLoading(false)
    if (error) {
      setErrorMsg('Gagal: ' + error.message)
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-orange-500 mb-6 flex items-center gap-2">
          <span>✏️</span> Edit Transaksi
        </h2>

      {/* TAMPILAN ERROR */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 text-xs rounded-lg animate-pulse">
          ⚠️ {errorMsg}
        </div>
      )}
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tanggal</label>
              <input 
                type="date" 
                value={date} 
                max={today} 
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (selectedDate > today) {
                    alert("Anda tidak bisa memilih tanggal masa depan!");
                    setDate(today); // Otomatis balikkan ke hari ini
                  } else {
                    setDate(selectedDate);
                  }
                }} 
                className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Exchange</label>
              <input type="text" value={exchange} onChange={(e) => setExchange(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm outline-none focus:border-orange-500" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Modal (IDR)</label>
            <input type="number" min="1" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm outline-none focus:border-orange-500" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jumlah BTC</label>
            <input type="number" min="0.00000001" step="any" value={btcAmount} onChange={(e) => setBtcAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm outline-none focus:border-orange-500" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fee Transaksi (IDR)</label>
            <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm outline-none focus:border-orange-500" />
          </div>

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold transition-all">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}