'use client'

import { useState, useEffect } from 'react'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import Image from '@/components/Image'
import VectorVote from '@/components/TemperatureVote'
import { formatDate } from 'pliny/utils/formatDate'
import siteMetadata from '@/data/siteMetadata'
import { getArticleImage } from '@/utils/backupImages'
import { truncateTitle, getDisplaySummary } from '@/utils/textUtils'

interface RisingPost {
  slug: string
  title: string
  summary: string
  date: string
  tags?: string[]
  images?: string[]
  canonicalUrl?: string
  temperature: number
}

interface RisingSectionProps {
  posts: any[] // All posts to filter from
}

const RisingSection = ({ posts }: RisingSectionProps) => {
  const [risingPosts, setRisingPosts] = useState<RisingPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRisingPosts = async () => {
      try {
        console.log('Fetching rising posts...')
        const response = await fetch('/api/rising')
        console.log('Rising API response status:', response.status)

        if (response.ok) {
          const risingData = await response.json()
          console.log('Rising data received:', risingData)

          // Match rising articles with post data
          const matchedPosts = risingData
            .map((item: any) => {
              const post = posts.find((p) => p.slug === item.article_id)
              if (post) {
                return {
                  ...post,
                  temperature: item.temperature,
                }
              }
              return null
            })
            .filter(Boolean)
            .slice(0, 4) // Show top 4 rising articles

          console.log('Matched posts:', matchedPosts)
          setRisingPosts(matchedPosts)
        } else {
          const errorText = await response.text()
          console.error('Rising API error:', response.status, errorText)

          // Fallback: show recent posts if API fails
          console.log('Using fallback: showing recent posts')
          const fallbackPosts = posts.slice(0, 4).map((post) => ({
            ...post,
            temperature: Math.random() * 15 + 5, // Mock temperature for demo
          }))
          setRisingPosts(fallbackPosts)
        }
      } catch (error) {
        console.error('Failed to fetch rising posts:', error)
      } finally {
        setLoading(false)
      }
    }

    if (posts.length > 0) {
      fetchRisingPosts()
    } else {
      setLoading(false)
    }
  }, [posts])

  if (loading) {
    return (
      <div className="py-12">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Rising</h2>
          <div className="h-1 w-20 rounded bg-green-500"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-4 aspect-[16/9] rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show section even if no rising posts, with a message
  if (!loading && risingPosts.length === 0) {
    return (
      <div className="py-12">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Rising</h2>
          <div className="h-1 w-20 rounded bg-green-500"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No articles are currently trending upward. Check back soon!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Rising</h2>
        <div className="h-1 w-20 rounded bg-green-500"></div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Articles with the highest positive momentum
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {risingPosts.map((post) => {
          const { slug, date, title, summary, tags, images, canonicalUrl, temperature } = post
          return (
            <article
              key={slug}
              className="overflow-hidden rounded-lg border border-green-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-green-900/30 dark:bg-gray-900"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={getArticleImage(images, slug)}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                  <div className="flex items-center font-semibold text-green-600 dark:text-green-400">
                    <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    +{temperature.toFixed(1)}
                  </div>
                </div>
                <h3 className="mb-2 text-lg leading-tight font-semibold text-gray-900 dark:text-gray-100">
                  <Link
                    href={canonicalUrl || `/blog/${slug}`}
                    className="transition-colors hover:text-green-600 dark:hover:text-green-400"
                  >
                    {truncateTitle(title, false)}
                  </Link>
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {getDisplaySummary(post, 'short')}
                </p>
                <div className="flex justify-center">
                  <VectorVote articleId={slug} className="scale-75" />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default RisingSection
