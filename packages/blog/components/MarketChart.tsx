'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Chart.js components to avoid SSR issues
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700"></div>
  ),
})

const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700"></div>
  ),
})

interface MarketChartProps {
  data: {
    marketCap: number
    volume24h: number
    circulatingSupply: number
    totalSupply: number
  }
  symbol: string
  name: string
}

export default function MarketChart({ data, symbol, name }: MarketChartProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  // Market Cap vs Volume Bar Chart
  const barData = {
    labels: ['Market Cap', '24h Volume'],
    datasets: [
      {
        label: 'Value (USD)',
        data: [data.marketCap, data.volume24h],
        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
        borderWidth: 1,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.y
            if (value >= 1e12) {
              return `${context.label}: $${(value / 1e12).toFixed(2)}T`
            } else if (value >= 1e9) {
              return `${context.label}: $${(value / 1e9).toFixed(2)}B`
            } else if (value >= 1e6) {
              return `${context.label}: $${(value / 1e6).toFixed(2)}M`
            } else {
              return `${context.label}: $${value.toLocaleString()}`
            }
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            if (value >= 1e12) {
              return `$${(value / 1e12).toFixed(1)}T`
            } else if (value >= 1e9) {
              return `$${(value / 1e9).toFixed(1)}B`
            } else if (value >= 1e6) {
              return `$${(value / 1e6).toFixed(1)}M`
            } else {
              return `$${value}`
            }
          },
        },
      },
    },
  }

  // Supply Distribution Doughnut Chart
  const supplyData = {
    labels: ['Circulating Supply', 'Non-Circulating'],
    datasets: [
      {
        data: [data.circulatingSupply, data.totalSupply - data.circulatingSupply],
        backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(156, 163, 175, 0.8)'],
        borderColor: ['rgba(99, 102, 241, 1)', 'rgba(156, 163, 175, 1)'],
        borderWidth: 2,
      },
    ],
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.parsed
            if (value >= 1e9) {
              return `${context.label}: ${(value / 1e9).toFixed(2)}B`
            } else if (value >= 1e6) {
              return `${context.label}: ${(value / 1e6).toFixed(2)}M`
            } else {
              return `${context.label}: ${value.toLocaleString()}`
            }
          },
        },
      },
    },
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
            Market Cap vs 24h Volume
          </h4>
          <div className="h-48 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700"></div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
            Supply Distribution
          </h4>
          <div className="h-48 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Market Cap vs Volume Chart */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          Market Cap vs 24h Volume
        </h4>
        <div className="h-48 w-full">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Supply Distribution Chart */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          Supply Distribution
        </h4>
        <div className="h-48 w-full">
          <Doughnut data={supplyData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  )
}
