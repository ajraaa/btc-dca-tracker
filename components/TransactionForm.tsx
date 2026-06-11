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

    const cleanFiat = fiatAmount.replace(/\./g, '')
    const fiat = parseFloat(cleanFiat) || 0
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

    if (btc <= 0.00000000) {
      setErrorMsg("Jumlah BTC harus lebih besar dari 0.00000000")
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
          fiat_amount: parseFloat(fiatAmount.replace(/\./g, '')),
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
    <form onSubmit={handleSubmit} className="card p-6 w-full">
      <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
        Tambah Transaksi DCA
      </h2>

      {/* TAMPILAN ERROR */}
      {errorMsg && (
        <div 
          className="mb-4 p-3 text-xs rounded-xl animate-pulse"
          style={{ 
            background: 'var(--red-subtle)', 
            border: '1px solid var(--red)',
            color: 'var(--red)',
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baris 1: Tanggal & Exchange */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Tanggal Pembelian</label>
          <input
            type="date"
            value={date}
            max={today} // VALIDASI HTML: Mematikan pilihan tanggal masa depan di kalender
            onChange={(e) => {
              const selectedDate = e.target.value;
              if (selectedDate > today) {
                alert("Anda tidak bisa memilih tanggal masa depan!");
                setDate(today); // Otomatis balikkan ke hari ini
              } else {
                setDate(selectedDate);
              }
            }}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Exchange (Contoh: Indodax/Binance)</label>
          <input
            type="text"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            placeholder="Nama Exchange"
            className="input-field"
          />
        </div>

        {/* Baris 2: Modal & Jumlah BTC */}
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Total Modal (IDR)</label>
          <input
            type="text"
            value={fiatAmount}
            onChange={(e) => {
              const val = e.target.value
              const clean = val.replace(/\D/g, '')
              if (!clean) {
                setFiatAmount('')
                return
              }
              const formatted = new Intl.NumberFormat('id-ID').format(parseInt(clean, 10))
              setFiatAmount(formatted)
            }}
            placeholder="0"
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Jumlah BTC Didapat</label>
          <input
            type="number"
            step="any"
            min="0.00000001" // Browser-level validation
            value={btcAmount}
            onChange={(e) => setBtcAmount(e.target.value)}
            placeholder="0.00000000"
            className="input-field"
            required
          />
        </div>

        {/* Baris 3: Fee (Opsional) */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Biaya Transaksi / Fee (IDR)</label>
          <input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 btn-primary"
      >
        {loading ? 'Memproses...' : 'Simpan Transaksi'}
      </button>
    </form>
  )
}