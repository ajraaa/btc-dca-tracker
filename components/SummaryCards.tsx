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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Ikon mata tertutup (hidden)
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setVisible(v => !v)}
          className="flex items-center gap-1.5 transition-colors text-xs px-2.5 py-1.5 rounded-lg cursor-pointer"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          title={visible ? 'Sembunyikan nilai' : 'Tampilkan nilai'}
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
          <span>{visible ? 'Sembunyikan' : 'Tampilkan'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Modal */}
        <div className="card p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Modal</p>
          <div className="text-sm sm:text-xl font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>
            {visible ? (
              <NumberFlow value={displayModal} format={formatOptions} locales={locale} />
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        {/* Aset BTC */}
        <div className="card p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Aset BTC</p>
          <div className="text-sm sm:text-xl font-bold mt-1.5 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            {visible ? (
              <>
                <NumberFlow value={totalBtc} format={{ minimumFractionDigits: 8, maximumFractionDigits: 8 }} />
                <span className="text-[8px] sm:text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>BTC</span>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        {/* Harga Rata-rata */}
        <div className="card p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Harga Rata-rata</p>
          <div className="text-sm sm:text-xl font-bold mt-1.5" style={{ color: 'var(--accent)' }}>
            {visible ? (
              <NumberFlow value={avgPrice} format={formatOptions} locales={locale} />
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        {/* Nilai Saat Ini */}
        <div className="card p-3 sm:p-5">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nilai Saat Ini</p>
          <div className="text-sm sm:text-xl font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>
            {visible ? (
              <NumberFlow value={currentValue} format={formatOptions} locales={locale} />
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>{HIDDEN_VALUE}</span>
            )}
          </div>
        </div>

        {/* Profit / Loss */}
        <div className="col-span-2 sm:col-span-1 card p-3 sm:p-5 relative group">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profit / Loss</p>
          {onShare && (
            <button 
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 sm:top-3 sm:right-3 sm:translate-y-0 p-2.5 sm:p-2 rounded-full transition-all duration-300 cursor-pointer group/share"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              title="Share PnL"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-3.5 sm:h-3.5 group-hover/share:-translate-y-0.5 transition-transform">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
          )}
          <div className="text-sm sm:text-xl font-bold mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <NumberFlow 
              value={pnlPercentage} 
              format={{ 
                style: 'percent' as const, 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2,
                signDisplay: 'always' as const
              }} 
              style={{ color: pnlPercentage >= 0 ? 'var(--green)' : 'var(--red)' }}
            />
            <div className="text-[10px] sm:text-xs font-medium flex items-center" style={{ color: 'var(--text-muted)' }}>
              <span>(</span>
              {visible ? (
                <NumberFlow 
                  value={pnlNominal} 
                  format={{...formatOptions, signDisplay: 'always' as const}} 
                  locales={locale}
                />
              ) : (
                <span>{HIDDEN_VALUE}</span>
              )}
              <span>)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}