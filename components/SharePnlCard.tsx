'use client'
import React from 'react'

interface SharePnLCardProps {
  avgPrice: number
  currentPrice: number
  currency: 'IDR' | 'USD'
  pnlPercentage: number
  id: string
}

export default function SharePnLCard({ 
  avgPrice, 
  currentPrice, 
  currency, 
  pnlPercentage, 
  id 
}: SharePnLCardProps) {
  
  const isProfit = pnlPercentage >= 0
  const colorClass = isProfit ? 'text-green-400' : 'text-red-400'
  
  const formatValue = (val: number) => {
    return currency === 'IDR' 
      ? `Rp ${Math.round(val).toLocaleString('id-ID')}`
      : `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
  }

  return (
    /* Container Luar: Kita letakkan jauh di luar layar (absolute -left-[9999px]) */
    <div className="absolute -left-[9999px] top-0">
      <div 
        id={id}
        className="w-[500px] h-[500px] bg-gray-950 p-10 flex flex-col justify-between relative overflow-hidden border border-gray-800"
        style={{ fontFamily: 'sans-serif' }}
      >
        {/* Ornamen Background (Mesh Gradient) */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px]" />

        {/* Watermark Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <img src="/icon.svg" alt="Watermark" className="w-80 h-80" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start z-10">
          <div>
            <h1 className="text-2xl font-black text-orange-500 italic tracking-tighter">BTC TRACKER</h1>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase mt-1">Investment Performance</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 font-mono">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Main Content: PnL Percentage */}
        <div className="text-center z-10">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Return on Investment</p>
          <h2 className={`text-8xl font-black tracking-tighter ${colorClass}`}>
            {isProfit ? '+' : ''}{pnlPercentage.toFixed(2)}%
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6 border-t border-gray-800 pt-8 z-10 text-center">
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Average Price</p>
            <p className="text-white text-sm font-semibold mt-1">{formatValue(avgPrice)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Current BTC Price</p>
            <p className="text-white text-sm font-semibold mt-1">{formatValue(currentPrice)}</p>
          </div>
        </div>

        {/* Badge / Hashtags */}
        <div className="flex justify-center z-10 mt-2">
          <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
             <p className="text-orange-500 text-[10px] font-bold tracking-tighter">#HODL #BTC</p>
          </div>
        </div>

        {/* Footer / Watermark */}
        <div className="absolute bottom-4 right-6 opacity-30">
          <p className="text-[8px] text-gray-400">btc-dca-tracker.vercel.app</p>
        </div>
      </div>
    </div>
  )
}