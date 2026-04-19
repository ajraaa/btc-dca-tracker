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
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(8px)' }}
    >
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit Transaksi
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
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Tanggal</label>
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
                className="input-field" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Exchange</label>
              <input type="text" value={exchange} onChange={(e) => setExchange(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Modal (IDR)</label>
            <input type="number" min="1" value={fiatAmount} onChange={(e) => setFiatAmount(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Jumlah BTC</label>
            <input type="number" min="0.00000001" step="any" value={btcAmount} onChange={(e) => setBtcAmount(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>Fee Transaksi (IDR)</label>
            <input type="number" value={fee} onChange={(e) => setFee(e.target.value)} className="input-field" />
          </div>

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary text-xs">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary text-xs">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}