'use client'

import { useEffect, useState } from 'react'

interface MarketData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
}

const MarketTicker = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSet, setCurrentSet] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market-data')
        if (response.ok) {
          const result = await response.json()
          setMarketData(result.data)
        }
      } catch (error) {
        console.error('Error fetching market data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMarketData()

    // Refresh data every 10 minutes to respect API rate limits
    const interval = setInterval(fetchMarketData, 600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (marketData.length === 0) return

    const interval = setInterval(() => {
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentSet((prev) => (prev + 1) % Math.ceil(marketData.length / 4))
        setIsTransitioning(false)
      }, 300) // Transition duration
    }, 5000) // Display each set for 5 seconds

    return () => clearInterval(interval)
  }, [marketData])

  if (loading) {
    return (
      <div className="border-y border-gray-200 bg-gray-50 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
            Loading market data...
          </div>
        </div>
      </div>
    )
  }

  if (marketData.length === 0) {
    return null
  }

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } else {
      return price.toFixed(4)
    }
  }

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2)
  }

  const formatChangePercent = (percent: number) => {
    return percent >= 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`
  }

  // Split market data into sets of 4
  const marketSets: MarketData[][] = []
  for (let i = 0; i < marketData.length; i += 4) {
    marketSets.push(marketData.slice(i, i + 4))
  }

  const currentMarkets = marketSets[currentSet] || []

  return (
    <div className="border-y border-gray-200 bg-gray-50 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-center gap-2 px-2 sm:gap-4 md:gap-8">
        {currentMarkets.map((crypto, index) => (
          <div
            key={`${currentSet}-${index}`}
            className={`flex min-w-0 items-center gap-1 transition-opacity duration-300 sm:gap-2 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <span className="text-xs font-bold text-gray-900 sm:text-sm dark:text-gray-100">
              {crypto.symbol}
            </span>
            <span className="text-xs text-gray-700 sm:text-sm dark:text-gray-300">
              ${formatPrice(crypto.current_price)}
            </span>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                crypto.price_change_24h >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatChange(crypto.price_change_24h)} (
              {formatChangePercent(crypto.price_change_percentage_24h)})
            </span>
            <span
              className={`text-xs font-medium sm:hidden ${
                crypto.price_change_24h >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatChangePercent(crypto.price_change_percentage_24h)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MarketTicker
