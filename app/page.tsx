'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import TransactionForm from '@/components/TransactionForm'
import SummaryCards from '@/components/SummaryCards'
import TransactionTable from '@/components/TransactionTable'
import TransactionCharts from '../components/TransactionCharts'

// Interface tetap sama
interface Transaction {
  id: string; purchase_date: string; exchange_name: string | null;
  fiat_amount: number; btc_amount: number; fee: number;
}
interface SummaryData { total_modal: number; total_btc: number; }

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<SummaryData>({ total_modal: 0, total_btc: 0 })
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR')
  const [prices, setPrices] = useState({ idr: 0, usd: 0 })
  const [usdRate, setUsdRate] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [transactionView, setTransactionView] = useState<'table' | 'bar' | 'line'>('table')
  const itemsPerPage = 10

  const fetchData = useCallback(async (userId: string, page: number = 1) => {
    const [allTxResponse, sumResponse] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false }),
      supabase.from('dca_summary').select('*').eq('user_id', userId).maybeSingle(),
    ])

    const allTx = (allTxResponse.data as Transaction[]) || []
    setAllTransactions(allTx)
    setTotalCount(allTx.length)

    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage
    setTransactions(allTx.slice(from, to))

    if (sumResponse.data) setSummary(sumResponse.data as SummaryData)
  }, [itemsPerPage])

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr,usd')
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) return // Rate limit: skip tanpa mengganggu UI
        return
      }

      const idr = data?.bitcoin?.idr
      const usd = data?.bitcoin?.usd
      if (typeof idr === 'number' && typeof usd === 'number' && usd > 0) {
        setPrices({ idr, usd })
        setUsdRate(idr / usd)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch {
      // Gagal fetch (network/parse): pertahankan harga terakhir, tidak tampilkan error overlay
    }
  }, [])

  // 1. Fungsi khusus untuk menangani perpindahan halaman
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage
    setTransactions(allTransactions.slice(from, to))
  }

  // 2. Effect hanya untuk inisialisasi pertama kali (Mount)
  useEffect(() => {
    const initApp = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)
      await Promise.all([fetchPrice(), fetchData(authUser.id, 1)])
      setLoading(false)
    }
    initApp()

    // --- LOGIKA REAL-TIME DIMULAI ---
    // Jalankan fetchPrice setiap 30 detik
    const interval = setInterval(() => {
      fetchPrice()
    }, 30000) // 30000 ms = 30 detik

    // Membersihkan interval saat komponen tidak lagi dibuka (unmount)
    // Ini PENTING agar tidak terjadi memory leak
    return () => clearInterval(interval)
  }, [router, fetchData, fetchPrice])

  // EFFECT PAGINATION DIHAPUS karena sudah ditangani handlePageChange

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium">Sinkronisasi data...</p>
      </div>
    )
  }

  return (
    <main className="p-4 md:p-10 text-white bg-gray-950 min-h-screen">
      {/* Header & SummaryCards tetap sama */}
      <header className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <div>
          <p className="text-[10px] text-gray-500 italic">Harga diperbarui pada: {lastUpdated}</p>
          <h1 className="text-3xl font-black text-orange-500 tracking-tighter italic uppercase">BTC Tracker</h1>
          <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-md transition-all"
            >
              Tambah Transaksi
            </button>
            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
              {(['IDR', 'USD'] as const).map((curr) => (
                <button 
                  key={curr} 
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${currency === curr ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
                >{curr}</button>
              ))}
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-gray-400 hover:text-white ml-4">Logout</button>
        </div>
      </header>

      <SummaryCards
        totalModal={summary.total_modal} 
        totalBtc={summary.total_btc} 
        currentPrice={currency === 'IDR' ? prices.idr : prices.usd}
        usdRate={usdRate}
        currency={currency} 
      />

      <div className="mt-8">
        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-900 p-1 rounded-full border border-gray-700 text-[10px] font-semibold">
            {(['table', 'bar', 'line'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setTransactionView(view)}
                className={`px-3 py-1 rounded-full transition-all ${
                  transactionView === view
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {view === 'table' ? 'Tabel' : view === 'bar' ? 'Bar Chart' : 'Line Chart'}
              </button>
            ))}
          </div>
        </div>

        {transactionView === 'table' ? (
          <TransactionTable
            transactions={transactions}
            onUpdate={() => fetchData(user!.id, currentPage)}
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        ) : (
          <TransactionCharts
            mode={transactionView === 'bar' ? 'bar' : 'line'}
            transactions={allTransactions}
          />
        )}
      </div>

      {isAddTransactionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-xl mx-4">
            <TransactionForm
              userId={user!.id}
              onSuccess={() => {
                fetchData(user!.id, currentPage)
                setIsAddTransactionOpen(false)
              }}
            />
            <button
              type="button"
              onClick={() => setIsAddTransactionOpen(false)}
              className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold py-2 px-4 rounded-lg border border-gray-700 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </main>
  )
}