'use client'

interface SummaryProps {
  totalModal: number // Selalu dalam IDR dari database
  totalBtc: number
  currentPrice: number // Dinamis (bisa IDR atau USD harga BTC)
  usdRate: number
  currency: 'IDR' | 'USD'
}

export default function SummaryCards({ totalModal, totalBtc, currentPrice, usdRate, currency }: SummaryProps) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Modal</p>
        <p className="text-xl font-bold mt-1">{formatValue(displayModal)}</p>
      </div>

      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Aset BTC</p>
        <p className="text-xl font-bold mt-1 text-orange-400">
          {totalBtc.toFixed(8)} <span className="text-[10px] text-gray-500">BTC</span>
        </p>
      </div>

      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Harga Rata-rata</p>
        <p className="text-xl font-bold mt-1 text-orange-400">{formatValue(avgPrice)}</p>
      </div>

      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Nilai Saat Ini</p>
        <p className="text-xl font-bold mt-1">{formatValue(currentValue)}</p>
      </div>

      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Profit / Loss</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className={`text-xl font-bold ${pnlNominal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500">
            ({pnlNominal >= 0 ? '+' : ''}{formatValue(pnlNominal)})
          </p>
        </div>
      </div>
    </div>
  )
}