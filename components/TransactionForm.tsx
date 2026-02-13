'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TransactionFormProps {
  userId: string
  onSuccess: () => void
}

export default function TransactionForm({ userId, onSuccess }: TransactionFormProps) {
  // State untuk field yang lebih lengkap
  const [fiatAmount, setFiatAmount] = useState('')
  const [btcAmount, setBtcAmount] = useState('')
  const [fee, setFee] = useState('0')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]) // Default hari ini
  const [exchange, setExchange] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const today = new Date().toLocaleDateString('en-CA');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

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
      .insert([
        {
          user_id: userId,
          fiat_amount: parseFloat(fiatAmount),
          btc_amount: parseFloat(btcAmount),
          fee: parseFloat(fee),
          purchase_date: new Date(date).toISOString(),
          exchange_name: exchange,
        },
      ])

    setLoading(false)

    if (error) {
      setErrorMsg('Gagal: ' + error.message)
    } else {
      // Reset form
      setFiatAmount('')
      setBtcAmount('')
      setFee('0')
      setExchange('')
      onSuccess()
      alert('Transaksi tersimpan!')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 w-full">
      <h2 className="text-xl font-semibold mb-6 text-orange-500 flex items-center gap-2">
        <span>➕</span> Tambah Transaksi DCA
      </h2>

      {/* TAMPILAN ERROR */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 text-xs rounded-lg animate-pulse">
          ⚠️ {errorMsg}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baris 1: Tanggal & Exchange */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Tanggal Pembelian</label>
          <input
            type="date"
            value={date}
            max={today} // VALIDASI HTML: Mematikan pilihan tanggal masa depan di kalender
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 rounded bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Exchange (Contoh: Indodax/Binance)</label>
          <input
            type="text"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            placeholder="Nama Exchange"
            className="w-full p-2.5 rounded bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none text-sm"
          />
        </div>

        {/* Baris 2: Modal & Jumlah BTC */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Total Modal (IDR)</label>
          <input
            type="number"
            min="1" // Browser-level validation
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            placeholder="0"
            className="w-full p-2.5 rounded bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Jumlah BTC Didapat</label>
          <input
            type="number"
            step="any"
            min="0.00000001" // Browser-level validation
            value={btcAmount}
            onChange={(e) => setBtcAmount(e.target.value)}
            placeholder="0.00000000"
            className="w-full p-2.5 rounded bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none text-sm"
            required
          />
        </div>

        {/* Baris 3: Fee (Opsional) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Biaya Transaksi / Fee (IDR)</label>
          <input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="w-full p-2.5 rounded bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Memproses...' : 'Simpan Transaksi'}
      </button>
    </form>
  )
}