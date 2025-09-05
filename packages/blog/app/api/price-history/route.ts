import { NextResponse } from 'next/server'

// Cache to store price history data
const priceHistoryCache: {
  [key: string]: {
    data: any
    timestamp: number
  }
} = {}

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes in milliseconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const coinId = searchParams.get('coinId')
  const days = searchParams.get('days') || '7'
  const cacheKey = `${coinId}-${days}`
  const now = Date.now()

  if (!coinId) {
    return NextResponse.json({ error: 'coinId parameter is required' }, { status: 400 })
  }

  try {
    // Check if we have cached data that's still fresh
    if (
      priceHistoryCache[cacheKey] &&
      now - priceHistoryCache[cacheKey].timestamp < CACHE_DURATION
    ) {
      return NextResponse.json({
        ...priceHistoryCache[cacheKey].data,
        cached: true,
        timestamp: priceHistoryCache[cacheKey].timestamp,
      })
    }

    // Fetch historical price data from CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days === '1' ? 'hourly' : 'daily'}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoFeed/1.0',
        },
      }
    )

    if (!response.ok) {
      console.warn(`CoinGecko API error for ${coinId}: ${response.status} ${response.statusText}`)

      // If we get a 429 or other error, return cached data if available
      if (priceHistoryCache[cacheKey]) {
        return NextResponse.json({
          ...priceHistoryCache[cacheKey].data,
          cached: true,
          timestamp: priceHistoryCache[cacheKey].timestamp,
          warning: 'Using cached data due to API rate limit',
        })
      }

      // If no cache, return empty data instead of error
      return NextResponse.json({
        prices: [],
        timestamps: [],
        marketCaps: [],
        volumes: [],
        cached: false,
        timestamp: now,
        warning: 'No data available due to API rate limit',
      })
    }

    const data = await response.json()

    // Transform the data for our chart component
    const transformedData = {
      prices: data.prices.map((item: [number, number]) => item[1]),
      timestamps: data.prices.map((item: [number, number]) => {
        const date = new Date(item[0])
        return days === '1'
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      marketCaps: data.market_caps.map((item: [number, number]) => item[1]),
      volumes: data.total_volumes.map((item: [number, number]) => item[1]),
    }

    // Update cache
    priceHistoryCache[cacheKey] = {
      data: transformedData,
      timestamp: now,
    }

    return NextResponse.json({
      ...transformedData,
      cached: false,
      timestamp: now,
    })
  } catch (error) {
    console.error('Error fetching price history:', error)

    // Return cached data if available, even if stale
    if (priceHistoryCache[cacheKey]) {
      return NextResponse.json({
        ...priceHistoryCache[cacheKey].data,
        cached: true,
        timestamp: priceHistoryCache[cacheKey].timestamp,
        warning: 'Using cached data due to API error',
      })
    }

    // If no cache and error occurs, return empty data
    return NextResponse.json({
      prices: [],
      timestamps: [],
      marketCaps: [],
      volumes: [],
      cached: false,
      timestamp: Date.now(),
      warning: 'No data available due to API error',
    })
  }
}
