import { NextRequest, NextResponse } from 'next/server'

const COINGECKO_BASE =
  'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const vsCurrency = searchParams.get('vs_currency') || 'idr'
  const days = searchParams.get('days') || '30'

  try {
    const url = `${COINGECKO_BASE}?vs_currency=${encodeURIComponent(vsCurrency)}&days=${encodeURIComponent(days)}`

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // Cache historical data for 5 minutes server-side
      next: { revalidate: 300 },
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
    console.error('[api/history] Failed to fetch from CoinGecko:', err)
    return NextResponse.json(
      { error: 'Failed to fetch history data' },
      { status: 502 },
    )
  }
}
