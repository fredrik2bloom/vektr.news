'use client'

import { useState, useEffect } from 'react'

interface VectorData {
  slope: number
  thumbscount: number
  status: 'upward' | 'flat' | 'downward'
  userVoted?: boolean
  userVote?: number | null
}

interface VectorVoteProps {
  articleId: string
  className?: string
}

export default function VectorVote({ articleId, className = '' }: VectorVoteProps) {
  const [data, setData] = useState<VectorData>({
    slope: 0,
    thumbscount: 0,
    status: 'flat',
  })
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial vector data
  useEffect(() => {
    const fetchVector = async () => {
      try {
        const response = await fetch(`/api/temperature?id=${articleId}`)
        if (response.ok) {
          const result = await response.json()
          // Map temperature response to vector data
          setData({
            slope: result.temp,
            thumbscount: result.thumbscount,
            status:
              result.status === 'hot' ? 'upward' : result.status === 'cold' ? 'downward' : 'flat',
            userVoted: result.userVoted,
            userVote: result.userVote,
          })
        }
      } catch (err) {
        console.error('Failed to fetch vector:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVector()
  }, [articleId])

  const handleVote = async (delta: 1 | -1) => {
    if (voting || data.userVoted) return

    setVoting(true)
    setError(null)

    // Optimistic update
    const newSlope = data.slope + delta
    const optimisticData = {
      ...data,
      slope: newSlope,
      thumbscount: data.thumbscount + 1,
      status: getVectorStatus(newSlope),
      userVoted: true,
      userVote: delta,
    }
    setData(optimisticData)

    try {
      const response = await fetch('/api/temperature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: articleId,
          delta,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setData({
          slope: result.temp,
          thumbscount: result.thumbscount,
          status:
            result.status === 'hot' ? 'upward' : result.status === 'cold' ? 'downward' : 'flat',
          userVoted: true,
          userVote: delta,
        })
      } else {
        // Revert optimistic update on error
        setData(data)

        const errorData = await response.json()
        if (response.status === 409) {
          setError('You have already voted on this article')
          setData((prev) => ({ ...prev, userVoted: true }))
        } else if (response.status === 429) {
          setError('Too many requests. Please try again later.')
        } else {
          setError(errorData.error || 'Failed to vote')
        }
      }
    } catch (err) {
      // Revert optimistic update on network error
      setData(data)
      setError('Network error. Please try again.')
    } finally {
      setVoting(false)
    }
  }

  const getVectorStatus = (slope: number): 'upward' | 'flat' | 'downward' => {
    if (slope >= 10) return 'upward'
    if (slope <= -10) return 'downward'
    return 'flat'
  }

  const getVectorColor = () => {
    switch (data.status) {
      case 'upward':
        return 'text-green-600 dark:text-green-400'
      case 'downward':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  // Calculate arrow rotation based on slope (-45 to +45 degrees)
  const getArrowRotation = () => {
    const scaledSlope = data.slope * -3 // Invert and amplify
    const clampedSlope = Math.max(-45, Math.min(45, scaledSlope))
    return clampedSlope
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex animate-pulse items-center space-x-2">
          <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Vector Arrow Display */}
      <div className="flex items-center space-x-2">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className={`transition-transform duration-300 ${getVectorColor()}`}
            style={{
              transform: `rotate(${getArrowRotation()}deg)`,
              transformOrigin: 'center',
            }}
          >
            <defs>
              <marker
                id={`arrowhead-${articleId}`}
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="currentColor" />
              </marker>
            </defs>
            <line
              x1="4"
              y1="12"
              x2="20"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
              markerEnd={`url(#arrowhead-${articleId})`}
            />
          </svg>
        </div>
        <div className="flex flex-col items-center">
          <span className={`text-sm font-semibold ${getVectorColor()}`}>
            {data.slope > 0 ? '+' : ''}
            {data.slope.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">slope</span>
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="flex items-center space-x-1">
        {/* Upvote (green) */}
        <button
          onClick={() => handleVote(1)}
          disabled={voting || data.userVoted}
          className={`transform rounded-full p-2 transition-all duration-200 hover:scale-110 ${
            data.userVoted && data.userVote === 1
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'text-gray-400 hover:bg-green-50 hover:text-green-500 dark:hover:bg-green-900/20'
          } ${voting || data.userVoted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
          title="Increase slope (+1)"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Downvote (red) */}
        <button
          onClick={() => handleVote(-1)}
          disabled={voting || data.userVoted}
          className={`transform rounded-full p-2 transition-all duration-200 hover:scale-110 ${
            data.userVoted && data.userVote === -1
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20'
          } ${voting || data.userVoted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
          title="Decrease slope (-1)"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Vote Count */}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {data.thumbscount} {data.thumbscount === 1 ? 'vote' : 'votes'}
      </span>

      {/* Error Message */}
      {error && <div className="ml-2 text-xs text-red-600 dark:text-red-400">{error}</div>}
    </div>
  )
}
