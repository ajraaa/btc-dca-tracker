'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Scatter,
  Cell,
  ReferenceLine,
} from 'recharts'
import { lttb } from './utility/lttb'

/** Maximum number of non-purchase points to render in the line chart. */
const LTTB_THRESHOLD = 500

interface Transaction {
  id: string
  purchase_date: string
  exchange_name: string | null
  fiat_amount: number
  btc_amount: number
  fee: number
}

interface Props {
  transactions: Transaction[]
  mode: 'bar' | 'line'
  currency: 'IDR' | 'USD'
  usdRate: number
}

interface BtcHistoryPoint {
  ts: number
  dateLabel: string
  isoDate: string
  btcPrice: number
}

// Helper hook to read CSS variables at runtime
function useCSSVar(varName: string, fallback: string = '') {
  const [value, setValue] = useState(fallback)
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      if (v) setValue(v)
    }
    read()
    // Re-read on theme changes
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [varName])
  return value
}

export default function TransactionCharts({ transactions, mode, currency, usdRate }: Props) {
  const [btcHistory, setBtcHistory] = useState<BtcHistoryPoint[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [isMobile, setIsMobile] = useState(false)

  // Theme-aware colors
  const chartGrid = useCSSVar('--chart-grid', '#1e2433')
  const chartText = useCSSVar('--chart-text', '#6b7280')
  const tooltipBg = useCSSVar('--tooltip-bg', '#1a1f2e')
  const tooltipBorder = useCSSVar('--tooltip-border', '#232939')
  const tooltipText = useCSSVar('--tooltip-text', '#f1f3f5')
  const tooltipLabel = useCSSVar('--tooltip-label', '#9ca3af')
  const accent = useCSSVar('--accent', '#f97316')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // 1. Ambil data historis BTC (Hanya untuk mode Line)
  useEffect(() => {
    const loadHistory = async () => {
      if (!transactions.length || mode !== 'line') return
      setLoadingHistory(true)
      try {
        const firstDate = new Date(Math.min(...transactions.map(t => new Date(t.purchase_date).getTime())))
        const rawDays = Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / (24 * 60 * 60 * 1000)))
        
        // Normalize days to improve cache hit rate and respect CoinGecko's 365-day public API limit
        let days = 30
        if (rawDays > 30 && rawDays <= 90) days = 90
        else if (rawDays > 90) days = 365
        
        const vsCurrency = currency.toLowerCase()
        
        const res = await fetch(`/api/history?vs_currency=${vsCurrency}&days=${days}`)
        const json = await res.json()
        
        if (!res.ok || !json.prices || !Array.isArray(json.prices)) {
          throw new Error(json.error || `API error: ${res.status}`)
        }

        const uniquePrices = new Map<string, BtcHistoryPoint>()
        const startTs = firstDate.getTime() - 86400000 // 1 day padding before first transaction
        
        json.prices.forEach(([ts, price]: [number, number]) => {
          if (ts >= startTs) {
            const isoDate = new Date(ts).toISOString().split('T')[0]
            // Menimpa nilai sebelumnya untuk tanggal yang sama agar tidak ada duplikasi data (menghindari double tooltip di hari yang sama)
            uniquePrices.set(isoDate, {
              ts,
              dateLabel: new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
              isoDate,
              btcPrice: price
            })
          }
        })

        // Synthesize historical points for transactions older than the CoinGecko 365-day limit
        let earliestFetchedTs = Infinity
        for (const point of uniquePrices.values()) {
            if (point.ts < earliestFetchedTs) earliestFetchedTs = point.ts
        }

        transactions.forEach(tx => {
            const txTs = new Date(tx.purchase_date).getTime()
            if (txTs < earliestFetchedTs - 86400000) { // Older than fetched data
                const isoDate = new Date(txTs).toISOString().split('T')[0]
                if (!uniquePrices.has(isoDate) && tx.btc_amount > 0) {
                    const impliedPriceIdr = tx.fiat_amount / tx.btc_amount
                    const impliedPrice = vsCurrency === 'idr' ? impliedPriceIdr : impliedPriceIdr / usdRate
                    uniquePrices.set(isoDate, {
                        ts: txTs,
                        dateLabel: new Date(txTs).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                        isoDate,
                        btcPrice: impliedPrice
                    })
                }
            }
        })

        // Ensure chronological order
        setBtcHistory(Array.from(uniquePrices.values()).sort((a, b) => a.ts - b.ts))
      } catch (err) {
        console.error('Gagal fetch harga:', err)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [transactions, mode, currency, usdRate])

  // 2. Data khusus untuk Bar Chart (Urut berdasarkan tanggal)
  const barData = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime())
      .map(tx => ({
        dateLabel: new Date(tx.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        fiatAmount: tx.fiat_amount,
        btcAmount: tx.btc_amount
      }))
  }, [transactions])

  // 3. MERGE DATA: Untuk mode Line (Harga Market + Titik Beli)
  const mergedDataRaw = useMemo(() => {
    if (!btcHistory.length) return []
    const txMap = transactions.reduce((acc: Record<string, { fiat: number, btc: number }>, tx) => {
      const date = new Date(tx.purchase_date).toISOString().split('T')[0]
      if (!acc[date]) acc[date] = { fiat: 0, btc: 0 }
      acc[date].fiat += tx.fiat_amount
      acc[date].btc += tx.btc_amount
      return acc
    }, {})

    return btcHistory.map(point => ({
      ...point,
      purchasePrice: txMap[point.isoDate] ? point.btcPrice : null,
      fiatAmount: txMap[point.isoDate]?.fiat || 0,
      btcBought: txMap[point.isoDate]?.btc || null
    }))
  }, [btcHistory, transactions])

  // 4. LTTB down-sampling – keeps purchase points, reduces market-only noise
  const mergedData = useMemo(() => {
    if (!mergedDataRaw.length) return []

    const withLTTBFields = mergedDataRaw.map(p => ({
      ...p,
      x: p.ts,
      y: p.btcPrice,
      preserve: p.purchasePrice !== null,
    }))

    const downsampled = lttb(withLTTBFields, LTTB_THRESHOLD)

    // Strip the helper fields before handing to Recharts
    return downsampled.map(({ x, y, preserve, ...rest }) => rest)
  }, [mergedDataRaw])

  const averagePrice = useMemo(() => {
    if (!transactions.length) return 0
    const totalFiat = transactions.reduce((sum, tx) => sum + tx.fiat_amount, 0)
    const totalBtc = transactions.reduce((sum, tx) => sum + tx.btc_amount, 0)
    if (totalBtc === 0) return 0
    const avgIdr = totalFiat / totalBtc
    return currency === 'IDR' ? avgIdr : avgIdr / usdRate
  }, [transactions, currency, usdRate])

  const chartWidth = isMobile
    ? (mode === 'bar' 
        ? Math.max(containerWidth, barData.length * 60) 
        : Math.max(containerWidth, mergedData.length * 8))
    : containerWidth; // Full width on desktop, no scrolling

  if (mode === 'line' && loadingHistory) {
    return (
      <div className="h-72 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Menyelaraskan data pasar...
      </div>
    )
  }

  // Shared chart configs
  const barTooltipStyle = {
    contentStyle: { backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' },
    itemStyle: { color: tooltipText },
    labelStyle: { color: tooltipLabel },
  }

  const renderBarChart = (width?: number, height?: number) => {
    const props = width && height ? { width, height } : {}
    return (
      <BarChart {...props} data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: chartText }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: chartText }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp ${v.toLocaleString('id-ID')}`} />
        <Tooltip
          {...barTooltipStyle}
          formatter={(v: number | undefined) => [`Rp ${(v ?? 0).toLocaleString('id-ID')}`, 'Modal']}
        />
        <Bar dataKey="fiatAmount" fill={accent} radius={[6, 6, 0, 0]} />
      </BarChart>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const priceFormatted = currency === 'IDR'
        ? `Rp ${Math.round(data.btcPrice || 0).toLocaleString('id-ID')}`
        : `$ ${Math.round(data.btcPrice || 0).toLocaleString('en-US')}`
      return (
        <div style={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '12px', padding: '12px', fontSize: '11px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          <p style={{ color: tooltipLabel, margin: '0 0 6px 0' }}>{new Date(data.isoDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <p style={{ color: tooltipText, margin: 0 }}>
            Harga Market: {priceFormatted}
          </p>
          {data.purchasePrice && data.btcBought ? (
            <p style={{ color: '#fbbf24', margin: '6px 0 0 0' }}>
              BTC Didapat: {data.btcBought.toLocaleString('en-US', { maximumFractionDigits: 8 })} BTC
            </p>
          ) : null}
        </div>
      )
    }
    return null
  }

  const renderLineChart = (width?: number, height?: number) => {
    const props = width && height ? { width, height } : {}
    return (
      <ComposedChart {...props} data={mergedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
        <defs>
          <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accent} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={accent} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#fbbf24' }} minTickGap={30} axisLine={false} tickLine={false} />
        <YAxis hide={true} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        {averagePrice > 0 && (
          <ReferenceLine 
            y={averagePrice} 
            stroke={chartText} 
            strokeDasharray="3 3" 
            label={{ position: 'insideTopLeft', value: 'Avg Price', fill: chartText, fontSize: 10 }}
          />
        )}
        <Area type="monotone" dataKey="btcPrice" stroke={accent} strokeWidth={2} fillOpacity={1} fill="url(#colorBtc)" dot={false} />
        <Scatter dataKey="purchasePrice" fill="#fbbf24">
          {mergedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.purchasePrice ? '#fbbf24' : 'transparent'} />
          ))}
        </Scatter>
      </ComposedChart>
    )
  }

  return (
    <div className="card p-6 h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-bold tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
            {mode === 'bar' ? 'Distribusi Modal' : 'Strategi Akumulasi'}
          </h2>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {mode === 'bar' 
              ? 'Besaran Rupiah yang dialokasikan per transaksi' 
              : 'Titik kuning menunjukkan eksekusi DCA kamu terhadap harga pasar'}
          </p>
        </div>
      </div>

      <div className={`h-72 w-full ${isMobile ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}`} ref={containerRef} style={{ scrollbarWidth: 'thin' }}>
        {isMobile ? (
          <div style={{ width: chartWidth, height: '100%' }}>
            {mode === 'bar' 
              ? renderBarChart(chartWidth, 288)
              : renderLineChart(chartWidth, 288)
            }
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {mode === 'bar' ? renderBarChart() : renderLineChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}