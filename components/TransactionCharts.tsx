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

export default function TransactionCharts({ transactions, mode, currency }: Props) {
  const [btcHistory, setBtcHistory] = useState<BtcHistoryPoint[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [isMobile, setIsMobile] = useState(false)

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
        const days = Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / (24 * 60 * 60 * 1000)))
        const vsCurrency = currency.toLowerCase()
        
        const res = await fetch(`/api/history?vs_currency=${vsCurrency}&days=${days}`)
        const json = await res.json()
        
        const prices = json.prices.map(([ts, price]: [number, number]) => ({
          ts,
          dateLabel: new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
          isoDate: new Date(ts).toISOString().split('T')[0],
          btcPrice: price
        }))
        setBtcHistory(prices)
      } catch (err) {
        console.error('Gagal fetch harga:', err)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [transactions, mode, currency])

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

  const chartWidth = isMobile
    ? (mode === 'bar' 
        ? Math.max(containerWidth, barData.length * 60) 
        : Math.max(containerWidth, mergedData.length * 8))
    : containerWidth; // Full width on desktop, no scrolling

  if (mode === 'line' && loadingHistory) {
    return <div className="h-72 flex items-center justify-center text-gray-500 text-xs">Menyelaraskan data pasar...</div>
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6 shadow-2xl h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-bold text-gray-100 tracking-tight uppercase">
            {mode === 'bar' ? 'Distribusi Modal' : 'Strategi Akumulasi'}
          </h2>
          <p className="text-[10px] text-gray-500">
            {mode === 'bar' 
              ? 'Besaran Rupiah yang dialokasikan per transaksi' 
              : 'Titik kuning menunjukkan eksekusi DCA kamu terhadap harga pasar'}
          </p>
        </div>
      </div>

      <div className={`h-72 w-full ${isMobile ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}`} ref={containerRef} style={{ scrollbarWidth: 'thin' }}>
        {isMobile ? (
          <div style={{ width: chartWidth, height: '100%' }}>
            {mode === 'bar' ? (
              /* --- RENDER BAR CHART --- */
              <BarChart width={chartWidth} height={288} data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#4b5563' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#4b5563' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp ${v.toLocaleString('id-ID')}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: number | undefined) => [`Rp ${(v ?? 0).toLocaleString('id-ID')}`, 'Modal']}
              />
              <Bar dataKey="fiatAmount" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
            ) : (
              /* --- RENDER LINE/AREA CHART (MICROSTRATEGY STYLE) --- */
              <ComposedChart width={chartWidth} height={288} data={mergedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#fbbf24' }} minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis hide={true} domain={['auto', 'auto']} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const priceFormatted = currency === 'IDR'
                      ? `Rp ${Math.round(data.btcPrice || 0).toLocaleString('id-ID')}`
                      : `$ ${Math.round(data.btcPrice || 0).toLocaleString('en-US')}`
                    return (
                      <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', fontSize: '11px' }}>
                        <p style={{ color: '#94a3b8', margin: '0 0 6px 0' }}>{new Date(data.isoDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        <p style={{ color: '#e2e8f0', margin: 0 }}>
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
                }}
              />
              <Area type="monotone" dataKey="btcPrice" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorBtc)" dot={false} />
              <Scatter dataKey="purchasePrice" fill="#fbbf24">
                {mergedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.purchasePrice ? '#fbbf24' : 'transparent'} />
                ))}
                </Scatter>
              </ComposedChart>
            )}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {mode === 'bar' ? (
              /* --- RENDER BAR CHART (DESKTOP) --- */
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#4b5563' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#4b5563' }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp ${v.toLocaleString('id-ID')}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(v: number | undefined) => [`Rp ${(v ?? 0).toLocaleString('id-ID')}`, 'Modal']}
                />
                <Bar dataKey="fiatAmount" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              /* --- RENDER LINE/AREA CHART (DESKTOP) --- */
              <ComposedChart data={mergedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 9, fill: '#fbbf24' }} minTickGap={30} axisLine={false} tickLine={false} />
                <YAxis hide={true} domain={['auto', 'auto']} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      const priceFormatted = currency === 'IDR'
                        ? `Rp ${Math.round(data.btcPrice || 0).toLocaleString('id-ID')}`
                        : `$ ${Math.round(data.btcPrice || 0).toLocaleString('en-US')}`
                      return (
                        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px', fontSize: '11px' }}>
                          <p style={{ color: '#94a3b8', margin: '0 0 6px 0' }}>{new Date(data.isoDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p style={{ color: '#e2e8f0', margin: 0 }}>
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
                  }}
                />
                <Area type="monotone" dataKey="btcPrice" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorBtc)" dot={false} />
                <Scatter dataKey="purchasePrice" fill="#fbbf24">
                  {mergedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.purchasePrice ? '#fbbf24' : 'transparent'} />
                  ))}
                </Scatter>
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}