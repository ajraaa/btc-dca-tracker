# 🚀 BTC DCA Tracker

A simple application for monitoring Bitcoin investments using the *Dollar Cost Averaging* (DCA) method with real-time P/L.

<p align="center">
  <img src="docs/screenshots/main-view.png?v=2" width="600" alt="BTC DCA Tracker Dashboard">
</p>

## ✨ Key Features

* **Real-time PnL Tracking**: Monitor profit/loss live, updated every 30 seconds via CoinGecko API integration.
* **Dual Currency Mode**: Toggle the entire dashboard display between **IDR** (Rupiah) and **USD** (Dollar) for global standards.
* **Complete CRUD**: Full transaction data management (Create, Read, Update, and Delete).
* **Authentication**: Login system using Supabase Auth.
* **Premium Modern UI**: Premium and modern interface design with theme system customization support (Light/Dark mode) based on CSS variables.
* **Smooth Animations & Interactions**: Dynamic UI interactions using the *View Transition API* (for smooth animated transitions) and Framer Motion for switchers and other UI elements.
* **Share PnL**: Share investment performance summaries (Profit/Loss) as images instantly (supports *native sharing* on mobile and direct downloads on desktop).
* **Floating Action Button (FAB)**: Interactive quick-action button for adding new transactions.
* **Live Price Countdown Indicator**: An always-active visual bar indicator to track the countdown for live BTC price updates every 30 seconds.
* **Data Integrity**: Strict validation of numeric input (preventing zero/negative values) and future dates on both the frontend and database side.
* **Capital Distribution**: Visualize investment composition (the amount of each transaction) in an interactive *Bar Chart* to observe your asset distribution levels.
* **Accumulation Points**: Display purchase history along the BTC price timeline (*Line Chart*), making it easy to see entry points over time.
* **PWA (Progressive Web App) Ready**: The app can be installed directly on the *Home Screen* of Android, iOS, and Desktop devices. Equipped with a custom manifest, custom icons, *standalone* mode that minimizes the browser interface, as well as adaptive *status bar* colors (*theme color*) that automatically adjust to light/dark mode preferences.

## 🔮 Roadmap

*   [ ] **Calendar View**: Calendar visualization to monitor monthly/weekly investment consistency.
*   [ ] **Crypto Market Widgets**: Small widgets for *Bitcoin Halving* countdown and *Fear and Greed Index*.
*   [ ] **Data Portability**: Data Export & Import feature in CSV/JSON format.
*   [ ] **DCA vs Lump Sum Simulator**: Performance comparison between the DCA strategy and one-time purchase (*Lump Sum*).

## 🛠️ Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Database & Auth**: [Supabase](https://supabase.com/)
* **Real-time Price API**: [CoinGecko API](https://www.coingecko.com/en/api)
* **Language**: TypeScript


## 🚀 Getting Started (Local Setup)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ajraaa/btc-dca-tracker.git
    cd btc-dca-tracker
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file and enter your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**:
    Run the SQL query in the `/supabase/setup.sql` folder to create the `transactions` table and the `dca_summary` view.

5.  **Run the application**:
    ```bash
    npm run dev
    ```
