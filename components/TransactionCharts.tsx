import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  Scatter,
} from 'recharts'

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
}

type ChartMode = 'bar' | 'line'

export default function TransactionCharts({ transactions }: Props) {
  const [mode, setMode] = useState<ChartMode>('bar')
  const [btcHistory, setBtcHistory] = useState<
    { isoDate: string; dateLabel: string; btcPrice: number }[]
  >([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const chartData = useMemo(
    () =>
      [...transactions]
        .slice()
        .sort(
          (a, b) =>
            new Date(a.purchase_date).getTime() -
            new Date(b.purchase_date).getTime(),
        )
        .map((tx) => {
          const dateLabel = new Date(tx.purchase_date).toLocaleDateString(
            'id-ID',
            {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            },
          )
          const impliedPrice =
            tx.btc_amount > 0 ? tx.fiat_amount / tx.btc_amount : 0

          return {
            id: tx.id,
            dateLabel,
            fiatAmount: tx.fiat_amount,
            impliedPrice,
          }
        }),
    [transactions],
  )

  const hasData = chartData.length > 0

  // Tanggal pembelian pertama (untuk rentang chart)
  const firstPurchaseDate = useMemo(() => {
    if (!transactions.length) return null
    const dates = transactions.map((tx) => new Date(tx.purchase_date).getTime())
    return new Date(Math.min(...dates))
  }, [transactions])

  // Ambil harga historis BTC dari tanggal pembelian pertama hingga sekarang
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const now = Date.now()
        const from = firstPurchaseDate
          ? firstPurchaseDate.getTime()
          : now - 365 * 24 * 60 * 60 * 1000
        const days = Math.max(1, Math.ceil((now - from) / (24 * 60 * 60 * 1000)))
        // Coingecko batasi ~days; gunakan max 2000 hari untuk keamanan
        const safeDays = Math.min(days, 2000)

        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=idr&days=${safeDays}`,
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const prices: [number, number][] = json?.prices || []

        const cutoff = from

        const cleaned: { isoDate: string; dateLabel: string; btcPrice: number }[] =
          prices
            .filter(([ts]) => ts >= cutoff)
            .map(([ts, price]) => {
              const d = new Date(ts)
              const isoDate = d.toISOString().split('T')[0]
              const dateLabel = d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
              return { isoDate, dateLabel, btcPrice: price }
            })
            .sort(
              (a, b) =>
                new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime(),
            )

        setBtcHistory(cleaned)
      } catch (err) {
        console.error('Gagal mengambil data historis BTC', err)
        setBtcHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [firstPurchaseDate?.getTime() ?? 0])

  // Titik pembelian pada line chart (tanggal transaksi)
  const purchasePoints = useMemo(() => {
    if (!transactions.length || !btcHistory.length) return []

    const purchaseDates = new Set(
      transactions.map((tx) =>
        new Date(tx.purchase_date).toISOString().split('T')[0],
      ),
    )

    return btcHistory.filter((p) => purchaseDates.has(p.isoDate))
  }, [transactions, btcHistory])

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-xl h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">
            Visualisasi DCA BTC
          </h2>
          <p className="text-[10px] text-gray-500">
            Lihat distribusi modal & harga beli
          </p>
        </div>
        <div className="flex bg-gray-900 p-1 rounded-full border border-gray-700 text-[10px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('bar')}
            className={`px-3 py-1 rounded-full transition-all ${
              mode === 'bar'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Bar Chart
          </button>
          <button
            type="button"
            onClick={() => setMode('line')}
            className={`px-3 py-1 rounded-full transition-all ${
              mode === 'line'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Line Chart
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-xs text-gray-500">
          Belum ada data untuk ditampilkan.
        </div>
      ) : (
        <div className="h-64">
          {mode === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  angle={-30}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickFormatter={(v) =>
                    `Rp ${(v as number).toLocaleString('id-ID')}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: 10,
                  }}
                  formatter={(value: number) => [
                    `Rp ${value.toLocaleString('id-ID')}`,
                    'Modal',
                  ]}
                  labelStyle={{ fontSize: 10, color: '#e5e7eb' }}
                />
                <Bar
                  dataKey="fiatAmount"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <>
              {loadingHistory && (
                <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                  Memuat data historis BTC...
                </div>
              )}
              {!loadingHistory && btcHistory.length === 0 && (
                <div className="h-64 flex items-center justify-center text-xs text-gray-500">
                  Tidak dapat memuat data historis BTC.
                </div>
              )}
              {!loadingHistory && btcHistory.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={btcHistory}
                    margin={{ top: 10, right: 10, left: -10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      angle={-30}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickFormatter={(v) =>
                        `Rp ${(v as number).toLocaleString('id-ID')}`
                      }
                    />
                    <Tooltip
                      cursor={{ stroke: '#4b5563', strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        fontSize: 10,
                      }}
                      formatter={(value: number) => [
                        `Rp ${value.toLocaleString('id-ID')}`,
                        'Harga BTC (IDR)',
                      ]}
                      labelStyle={{ fontSize: 10, color: '#e5e7eb' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="btcPrice"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Scatter
                      data={purchasePoints}
                      dataKey="btcPrice"
                      fill="#facc15"
                      shape="circle"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

