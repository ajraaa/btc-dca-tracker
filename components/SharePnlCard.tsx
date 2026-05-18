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
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Watermark" className="w-96 h-96">
            <g transform="translate(256 256) scale(1.263158) translate(-232.000 -197.500)" fill="#ffffff" fillRule="evenodd">
              <path d="M 364 73 L 362 72 L 302 87 L 314 100 L 312 105 L 225 200 L 222 200 L 184 163 L 101 253 L 100 312 L 140 313 L 142 316 L 143 349 L 172 349 L 173 314 L 193 313 L 195 315 L 195 348 L 225 349 L 226 314 L 251 312 L 268 306 L 279 299 L 289 289 L 299 273 L 304 257 L 304 235 L 300 221 L 293 208 L 287 201 L 285 201 L 265 222 L 272 236 L 272 256 L 266 267 L 258 275 L 251 279 L 244 281 L 133 281 L 133 265 L 184 209 L 186 209 L 223 246 L 225 246 L 337 124 L 340 124 L 353 136 Z M 225 46 L 195 46 L 195 80 L 191 82 L 175 82 L 173 80 L 172 46 L 142 46 L 142 79 L 139 82 L 100 82 L 101 233 L 132 199 L 132 115 L 134 113 L 230 113 L 240 116 L 247 120 L 253 126 L 258 134 L 259 139 L 261 140 L 283 116 L 283 113 L 280 108 L 263 92 L 246 84 L 228 82 L 226 80 Z"/>
            </g>
          </svg>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-1">
            <div className="flex-shrink-0 text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Bitcoin growth icon" className="w-9 h-9">
                <g transform="translate(256 256) scale(1.263158) translate(-232.000 -197.500)" fill="currentColor" fillRule="evenodd">
                  <path d="M 364 73 L 362 72 L 302 87 L 314 100 L 312 105 L 225 200 L 222 200 L 184 163 L 101 253 L 100 312 L 140 313 L 142 316 L 143 349 L 172 349 L 173 314 L 193 313 L 195 315 L 195 348 L 225 349 L 226 314 L 251 312 L 268 306 L 279 299 L 289 289 L 299 273 L 304 257 L 304 235 L 300 221 L 293 208 L 287 201 L 285 201 L 265 222 L 272 236 L 272 256 L 266 267 L 258 275 L 251 279 L 244 281 L 133 281 L 133 265 L 184 209 L 186 209 L 223 246 L 225 246 L 337 124 L 340 124 L 353 136 Z M 225 46 L 195 46 L 195 80 L 191 82 L 175 82 L 173 80 L 172 46 L 142 46 L 142 79 L 139 82 L 100 82 L 101 233 L 132 199 L 132 115 L 134 113 L 230 113 L 240 116 L 247 120 L 253 126 L 258 134 L 259 139 L 261 140 L 283 116 L 283 113 L 280 108 L 263 92 L 246 84 L 228 82 L 226 80 Z"/>
                </g>
              </svg>
            </div>
            <div className="flex flex-col justify-between h-9">
              <h1 className="text-2xl font-black text-orange-500 italic tracking-tighter leading-none">BTC TRACKER</h1>
              <p className="text-[10px] text-gray-500 tracking-widest uppercase leading-none">Investment Performance</p>
            </div>
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