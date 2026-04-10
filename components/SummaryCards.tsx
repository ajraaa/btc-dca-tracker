'use client'

import { useState } from 'react'

interface SummaryProps {
  totalModal: number // Selalu dalam IDR dari database
  totalBtc: number
  currentPrice: number // Dinamis (bisa IDR atau USD harga BTC)
  usdRate: number
  currency: 'IDR' | 'USD'
}

const HIDDEN_VALUE = '********'

// Ikon mata terbuka (visible)
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Ikon mata tertutup (hidden)
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function SummaryCards({ totalModal, totalBtc, currentPrice, usdRate, currency }: SummaryProps) {
  const [visible, setVisible] = useState(true)

  // 1. Hitung Modal sesuai mata uang
  const displayModal = currency === 'IDR' ? totalModal : totalModal / usdRate
  
  // 2. Hitung Nilai Aset Sekarang
  const currentValue = totalBtc * currentPrice
  
  // 3. Hitung Average Price
  const avgPrice = totalBtc > 0 ? displayModal / totalBtc : 0
  
  // 4. Hitung PnL
  const pnlNominal = currentValue - displayModal
  const pnlPercentage = displayModal > 0 ? (pnlNominal / displayModal) * 100 : 0

  const formatValue = (val: number) => {
    return currency === 'IDR' 
      ? `Rp ${Math.round(val).toLocaleString('id-ID')}`
      : `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  /** Tampilkan nilai atau sembunyikan */
  const show = (content: string) => visible ? content : HIDDEN_VALUE

  return (
    <div className="mb-8">
      {/* Toggle visibility button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setVisible(v => !v)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-gray-700/50"
          title={visible ? 'Sembunyikan nilai' : 'Tampilkan nilai'}
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
          <span>{visible ? 'Sembunyikan' : 'Tampilkan'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Modal</p>
          <p className="text-xl font-bold mt-1">{show(formatValue(displayModal))}</p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Aset BTC</p>
          <p className="text-xl font-bold mt-1 text-orange-400">
            {visible ? (
              <>{totalBtc.toFixed(8)} <span className="text-[10px] text-gray-500">BTC</span></>
            ) : HIDDEN_VALUE}
          </p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Harga Rata-rata</p>
          <p className="text-xl font-bold mt-1 text-orange-400">{show(formatValue(avgPrice))}</p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Nilai Saat Ini</p>
          <p className="text-xl font-bold mt-1">{show(formatValue(currentValue))}</p>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Profit / Loss</p>
          <div className="flex items-baseline gap-2 mt-1">
            {visible ? (
              <>
                <p className={`text-xl font-bold ${pnlNominal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">
                  ({pnlNominal >= 0 ? '+' : ''}{formatValue(pnlNominal)})
                </p>
              </>
            ) : (
              <p className="text-xl font-bold text-gray-500">{HIDDEN_VALUE}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}