'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import TransactionForm from '@/components/TransactionForm'
import SummaryCards from '@/components/SummaryCards'
import TransactionTable from '@/components/TransactionTable'
import TransactionCharts from '../components/TransactionCharts'
import RefreshProgressBar from '@/components/RefreshProgressBar'
import SharePnLCard from '@/components/SharePnlCard'
import { toPng } from 'html-to-image'
import FAB from '@/components/FAB'

// Interface tetap sama
interface Transaction {
  id: string; purchase_date: string; exchange_name: string | null;
  fiat_amount: number; btc_amount: number; fee: number;
}
interface SummaryData { total_modal: number; total_btc: number; }

// Theme toggle icon components
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
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
  const [refreshKey, setRefreshKey] = useState(0)
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
      const res = await fetch('/api/price')
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
        setRefreshKey(prev => prev + 1)
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

  const handleShare = useCallback(async () => {
    const node = document.getElementById('share-pnl-card')
    if (node) {
      try {
        const dataUrl = await toPng(node, { cacheBust: true })
        
        // Cek apakah browser mendukung Web Share API untuk file
        if (navigator.share && navigator.canShare) {
          const res = await fetch(dataUrl)
          const blob = await res.blob()
          const file = new File([blob], `pnl-share-${new Date().getTime()}.png`, { type: 'image/png' })
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'BTC Tracker PnL',
              text: 'Check out my Bitcoin investment performance!',
            })
            return
          }
        }

        // Fallback: Download file jika Share API tidak tersedia
        const link = document.createElement('a')
        link.download = `pnl-share-${new Date().getTime()}.png`
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error('Failed to share or generate image', err)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
        <div className="w-10 h-10 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
        <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Sinkronisasi data...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <SharePnLCard 
        id="share-pnl-card"
        avgPrice={summary.total_btc > 0 ? (currency === 'IDR' ? summary.total_modal : summary.total_modal / usdRate) / summary.total_btc : 0}
        currentPrice={currency === 'IDR' ? prices.idr : prices.usd}
        currency={currency}
        pnlPercentage={(currency === 'IDR' ? summary.total_modal : summary.total_modal / usdRate) > 0 ? (((summary.total_btc * (currency === 'IDR' ? prices.idr : prices.usd)) - (currency === 'IDR' ? summary.total_modal : (summary.total_modal / usdRate || 1))) / (currency === 'IDR' ? summary.total_modal : (summary.total_modal / usdRate || 1))) * 100 : 0}
      />
      <RefreshProgressBar intervalMs={30000} key={refreshKey} />

      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>Harga diperbarui pada: {lastUpdated}</p>
            <h1 className="text-3xl font-black tracking-tighter italic uppercase leading-none sm:leading-tight mt-0.5" style={{ color: 'var(--accent)' }}>
              BTC<br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>Tracker
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Currency Switcher */}
            <div className="flex p-1 rounded-xl" style={{ background: 'var(--switcher-bg)', border: '1px solid var(--switcher-border)' }}>
              {(['IDR', 'USD'] as const).map((curr) => (
                <button 
                  key={curr} 
                  onClick={() => setCurrency(curr)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer`}
                  style={{ color: currency === curr ? '#ffffff' : 'var(--switcher-inactive)' }}
                >
                  {currency === curr && (
                    <motion.div
                      layoutId="currency-active"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'var(--accent)' }}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{curr}</span>
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={(e) => toggleTheme(e)}
              className="p-2.5 rounded-xl transition-all cursor-pointer"
              style={{ 
                color: 'var(--text-secondary)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Logout */}
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              title="Logout"
              className="p-2.5 rounded-xl transition-all cursor-pointer"
              style={{
                color: 'var(--text-muted)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        <SummaryCards
          totalModal={summary.total_modal} 
          totalBtc={summary.total_btc} 
          currentPrice={currency === 'IDR' ? prices.idr : prices.usd}
          usdRate={usdRate}
          currency={currency} 
          onShare={handleShare}
        />

        <div className="mt-8">
          <div className="flex justify-end mb-4">
            <div className="flex p-1 rounded-full text-[10px] font-semibold" style={{ background: 'var(--switcher-bg)', border: '1px solid var(--switcher-border)' }}>
              {(['table', 'bar', 'line'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setTransactionView(view)}
                  className={`relative px-3 py-1 rounded-full transition-colors cursor-pointer`}
                  style={{ color: transactionView === view ? '#ffffff' : 'var(--switcher-inactive)' }}
                >
                  {transactionView === view && (
                    <motion.div
                      layoutId="view-active"
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'var(--accent)' }}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">
                    {view === 'table' ? 'Tabel' : view === 'bar' ? 'Bar Chart' : 'Line Chart'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={transactionView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
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
                  currency={currency}
                  usdRate={usdRate}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isAddTransactionOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(8px)' }}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="w-full max-w-xl"
              >
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
                  className="mt-3 w-full btn-secondary text-xs font-semibold py-2.5 px-4"
                >
                  Tutup
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <FAB 
          onClick={() => setIsAddTransactionOpen(true)} 
          label="Tambah Transaksi" 
        />
      </div>
    </main>
  )
}