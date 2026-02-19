# 🚀 BTC DCA Tracker

Aplikasi sederhana untuk memantau investasi Bitcoin dengan metode *Dollar Cost Averaging* (DCA) dengan P/L real-time.

## ✨ Fitur Utama

* **Real-time PnL Tracking**: Pantau keuntungan/kerugian secara live yang di-update setiap 30 detik melalui integrasi API CoinGecko.
* **Dual Currency Mode**: Toggle tampilan seluruh dashboard antara **IDR** (Rupiah) dan **USD** (Dollar) untuk standar global.
* **Complete CRUD**: Manajemen data transaksi penuh (Tambah, Lihat, Edit, dan Hapus).
* **Authentication**: Sistem login menggunakan Supabase Auth.
* **Pagination**: Pembatasan jumlah data per halaman agar tabel tetap rapi.
* **Data Integrity**: Validasi input input angka 0, negatif, atau tanggal masa depan. Baik di sisi Frontend maupun Database.

## 🛠️ Tech Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Database & Auth**: [Supabase](https://supabase.com/)
* **Real-time Price API**: [CoinGecko API](https://www.coingecko.com/en/api)
* **Language**: TypeScript


## 🚀 Memulai (Setup Lokal)

1.  **Clone repositori**:
    ```bash
    git clone https://github.com/your-username/btc-dca-tracker.git
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
    Jalankan query SQL yang ada di folder `/supabase/setup.sql` (jika kamu menyimpannya) untuk membuat tabel `transactions` dan view `dca_summary`.

5.  **Jalankan aplikasi**:
    ```bash
    npm run dev
    ```
