import { NextResponse } from 'next/server'

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr,usd'

export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, {
      headers: { Accept: 'application/json' },
      // Revalidate every 30 seconds so the edge/server caches the result
      // and multiple clients won't each trigger a CoinGecko request.
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko responded with ${res.status}` },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/price] Failed to fetch from CoinGecko:', err)
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 502 },
    )
  }
}
