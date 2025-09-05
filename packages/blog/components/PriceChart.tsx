'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Chart.js components to avoid SSR issues
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
  loading: () => (
    <div className="h-32 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700"></div>
  ),
})

interface PriceChartProps {
  data: {
    prices: number[]
    timestamps: string[]
  }
  symbol: string
  name: string
  priceChange24h: number
}

export default function PriceChart({ data, symbol, name, priceChange24h }: PriceChartProps) {
  const [isClient, setIsClient] = useState(false)
  const isPositive = priceChange24h >= 0

  useEffect(() => {
    setIsClient(true)
  }, [])

  const chartData = {
    labels: data.timestamps,
    datasets: [
      {
        label: `${name} Price`,
        data: data.prices,
        borderColor: isPositive ? '#10b981' : '#ef4444',
        backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: isPositive ? '#10b981' : '#ef4444',
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            return `${symbol}: $${context.parsed.y.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}`
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  if (!isClient) {
    return <div className="h-32 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700"></div>
  }

  return (
    <div className="h-32 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
