# 🚀 BTC DCA Tracker

Aplikasi sederhana untuk memantau investasi Bitcoin dengan metode *Dollar Cost Averaging* (DCA) dengan P/L real-time.

<p align="center">
  <img src="docs/screenshots/main-view.png?v=2" width="600" alt="BTC DCA Tracker Dashboard">
</p>

## ✨ Fitur Utama

* **Real-time PnL Tracking**: Pantau keuntungan/kerugian secara live yang di-update setiap 30 detik melalui integrasi API CoinGecko.
* **Dual Currency Mode**: Toggle tampilan seluruh dashboard antara **IDR** (Rupiah) dan **USD** (Dollar) untuk standar global.
* **Complete CRUD**: Manajemen data transaksi penuh (Tambah, Lihat, Edit, dan Hapus).
* **Authentication**: Sistem login menggunakan Supabase Auth.
* **Premium Modern UI**: Desain antarmuka premium dan modern dengan dukungan kustomisasi sistem tema (Light/Dark mode) berbasis CSS variables.
* **Smooth Animations & Interactions**: Interaksi antarmuka dinamis menggunakan *View Transition API* (untuk efek animasi transisi mulus) dan Framer Motion untuk *switcher* serta elemen UI lainnya.
* **Share PnL**: Bagikan ringkasan performa investasi (Profit/Loss) ke dalam bentuk gambar secara instan (mendukung *native sharing* di mobile dan unduhan langsung di desktop).
* **Floating Action Button (FAB)**: Tombol aksi cepat interaktif untuk menambah transaksi baru.
* **Live Price Countdown Indicator**: Indikator bar visual yang selalu aktif untuk memantau waktu mundur pembaruan harga live BTC setiap 30 detik.
* **Data Integrity**: Validasi ketat input angka (mencegah nol/negatif) atau tanggal masa depan di sisi frontend maupun database.
* **Distribusi Modal**: Visualisasi komposisi investasi (jumlah setiap transaksi) dalam grafik batang (*Bar Chart*) interaktif untuk mengamati tingkat distribusi asetmu.
* **Titik Akumulasi**: Tampilkan riwayat pembelian di sepanjang garis waktu harga BTC (*Line Chart*), memudahkan kamu melihat titik masuk dari waktu ke waktu.

## 🔮 Rencana Masa Depan (Roadmap)

*   [ ] **Calendar View**: Visualisasi kalender untuk memantau konsistensi investasi bulanan/mingguan.
*   [ ] **Crypto Market Widgets**: Widget kecil untuk hitung mundur *Bitcoin Halving* dan *Fear and Greed Index*.
*   [ ] **Data Portability**: Fitur Ekspor & Impor data dalam format CSV/JSON.
*   [ ] **DCA vs Lump Sum Simulator**: Perbandingan performa antara strategi DCA dengan pembelian sekaligus (*Lump Sum*).

## 🛠️ Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Database & Auth**: [Supabase](https://supabase.com/)
* **Real-time Price API**: [CoinGecko API](https://www.coingecko.com/en/api)
* **Language**: TypeScript


## 🚀 Memulai (Setup Lokal)

1.  **Clone repositori**:
    ```bash
    git clone https://github.com/ajraaa/btc-dca-tracker.git
    cd btc-dca-tracker
    ```

2.  **Instalasi dependensi**:
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment Variables**:
    Buat file `.env.local` dan masukkan kredensial Supabase kamu:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Setup Database**:
    Jalankan query SQL yang ada di folder `/supabase/setup.sql` untuk membuat tabel `transactions` dan view `dca_summary`.

5.  **Jalankan aplikasi**:
    ```bash
    npm run dev
    ```
