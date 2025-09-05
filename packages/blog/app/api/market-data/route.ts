import { NextResponse } from 'next/server'

// Cache to store data and prevent excessive API calls
let marketDataCache: {
  data: any[]
  timestamp: number
} | null = null

// Fallback data in case API fails and no cache exists
const fallbackData = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    current_price: 43250.5,
    price_change_24h: 1250.3,
    price_change_percentage_24h: 2.95,
    market_cap: 850000000000,
    total_volume: 25000000000,
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    current_price: 2650.3,
    price_change_24h: -45.2,
    price_change_percentage_24h: -1.68,
    market_cap: 320000000000,
    total_volume: 15000000000,
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  },
  {
    id: 'ripple',
    symbol: 'XRP',
    name: 'XRP',
    current_price: 0.625,
    price_change_24h: 0.015,
    price_change_percentage_24h: 2.46,
    market_cap: 35000000000,
    total_volume: 2000000000,
    image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether',
    current_price: 1.0,
    price_change_24h: 0.0001,
    price_change_percentage_24h: 0.01,
    market_cap: 95000000000,
    total_volume: 50000000000,
    image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  },
]

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now()

    // Check if we have cached data that's still fresh
    if (marketDataCache && now - marketDataCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: marketDataCache.data,
        cached: true,
        timestamp: marketDataCache.timestamp,
      })
    }

    // Fetch fresh data from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,ripple,tether&order=market_cap_desc&per_page=4&page=1&sparkline=false',
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoFeed/1.0',
        },
      }
    )

    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status} ${response.statusText}`)

      // If we get a 429 or other error, return cached data if available
      if (marketDataCache) {
        return NextResponse.json({
          data: marketDataCache.data,
          cached: true,
          timestamp: marketDataCache.timestamp,
          warning: 'Using cached data due to API rate limit',
        })
      }

      // If no cache and API fails, return fallback data
      return NextResponse.json({
        data: fallbackData,
        cached: false,
        timestamp: now,
        warning: 'Using fallback data due to API unavailability',
      })
    }

    const data = await response.json()

    // Update cache
    marketDataCache = {
      data,
      timestamp: now,
    }

    return NextResponse.json({
      data,
      cached: false,
      timestamp: now,
    })
  } catch (error) {
    console.error('Error fetching market data:', error)

    // Return cached data if available, even if stale
    if (marketDataCache) {
      return NextResponse.json({
        data: marketDataCache.data,
        cached: true,
        timestamp: marketDataCache.timestamp,
        warning: 'Using cached data due to API error',
      })
    }

    // If no cache and error occurs, return fallback data
    return NextResponse.json({
      data: fallbackData,
      cached: false,
      timestamp: Date.now(),
      warning: 'Using fallback data due to API error',
    })
  }
}
