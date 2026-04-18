'use client'

import { useState } from 'react'
import NumberFlow from '@number-flow/react'

interface SummaryProps {
  totalModal: number // Selalu dalam IDR dari database
  totalBtc: number
  currentPrice: number // Dinamis (bisa IDR atau USD harga BTC)
  usdRate: number
  currency: 'IDR' | 'USD'
  onShare?: () => void
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

export default function SummaryCards({ totalModal, totalBtc, currentPrice, usdRate, currency, onShare }: SummaryProps) {
  const [visible, setVisible] = useState(true)

  // 1. Hitung Modal sesuai mata uang
  const displayModal = currency === 'IDR' ? totalModal : totalModal / usdRate
  
  // 2. Hitung Nilai Aset Sekarang
  const currentValue = totalBtc * currentPrice
  
  // 3. Hitung Average Price
  const avgPrice = totalBtc > 0 ? displayModal / totalBtc : 0
  
  // 4. Hitung PnL
  const pnlNominal = currentValue - displayModal
  const pnlPercentage = displayModal > 0 ? (pnlNominal / displayModal) : 0 // NumberFlow handles percentage conversion if style: 'percent' is used

  const formatOptions = {
    style: 'currency' as const,
    currency: currency,
    currencyDisplay: 'narrowSymbol' as const,
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2
  }

  const locale = currency === 'IDR' ? 'id-ID' : 'en-US'

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

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
        <div className="bg-gray-800 p-3 sm:p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Modal</p>
          <div className="text-sm sm:text-xl font-bold mt-1">
            {visible ? (
              <NumberFlow value={displayModal} format={formatOptions} locales={locale} />
            ) : (
              <span>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Aset BTC</p>
          <div className="text-sm sm:text-xl font-bold mt-1 text-orange-400 flex items-center gap-1">
            {visible ? (
              <>
                <NumberFlow value={totalBtc} format={{ minimumFractionDigits: 8, maximumFractionDigits: 8 }} />
                <span className="text-[8px] sm:text-[10px] text-gray-500 font-medium">BTC</span>
              </>
            ) : (
              <span>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Harga Rata-rata</p>
          <div className="text-sm sm:text-xl font-bold mt-1 text-orange-400">
            {visible ? (
              <NumberFlow value={avgPrice} format={formatOptions} locales={locale} />
            ) : (
              <span>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-5 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Nilai Saat Ini</p>
          <div className="text-sm sm:text-xl font-bold mt-1">
            {visible ? (
              <NumberFlow value={currentValue} format={formatOptions} locales={locale} />
            ) : (
              <span>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gray-800 p-3 sm:p-5 rounded-xl border border-gray-700 relative group">
          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Profit / Loss</p>
          {onShare && (
            <button 
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 sm:top-3 sm:right-3 sm:translate-y-0 p-2.5 sm:p-2 bg-white/5 hover:bg-orange-500 border border-white/10 hover:border-orange-400 rounded-full text-gray-400 hover:text-white transition-all duration-300 cursor-pointer shadow-xl hover:shadow-orange-500/40 hover:scale-110 backdrop-blur-sm group/share"
              title="Share PnL"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-3.5 sm:h-3.5 group-hover/share:-translate-y-0.5 transition-transform">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
          )}
          <div className="text-sm sm:text-xl font-bold mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0">
            {visible ? (
              <>
                <NumberFlow 
                  value={pnlPercentage} 
                  format={{ 
                    style: 'percent' as const, 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2,
                    signDisplay: 'always' as const
                  }} 
                  className={pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}
                />
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium flex items-center">
                  <span>(</span>
                  <NumberFlow 
                    value={pnlNominal} 
                    format={{...formatOptions, signDisplay: 'always' as const}} 
                    locales={locale}
                  />
                  <span>)</span>
                </div>
              </>
            ) : (
              <span className="text-gray-500">{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}