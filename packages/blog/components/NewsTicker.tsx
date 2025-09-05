'use client'

import { useEffect, useState } from 'react'
import Link from '@/components/Link'
import { truncateText } from '@/utils/textUtils'

interface Post {
  slug: string
  title: string
  canonicalUrl?: string
}

interface NewsTickerProps {
  posts: Post[]
}

const NewsTicker = ({ posts }: NewsTickerProps) => {
  const [tickerPosts, setTickerPosts] = useState<Post[]>([])

  useEffect(() => {
    // Get latest 8 posts and truncate long titles
    const latestPosts = posts.slice(0, 8).map((post) => ({
      ...post,
      title: truncateText(post.title, 60),
    }))
    setTickerPosts(latestPosts)
  }, [posts])

  if (tickerPosts.length === 0) return null

  return (
    <div className="relative w-full overflow-hidden border-y border-gray-200 bg-gray-100 py-2 dark:border-gray-700 dark:bg-gray-900">
      <div className="animate-marquee flex whitespace-nowrap hover:[animation-play-state:paused]">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex shrink-0">
            {tickerPosts.map((post, index) => (
              <div key={`${i}-${index}`} className="mx-4 flex shrink-0 items-center sm:mx-8">
                <span className="text-primary-500 mr-2 font-bold">•</span>
                <Link
                  href={post.canonicalUrl || `/blog/${post.slug}`}
                  className="hover:text-primary-500 dark:hover:text-primary-400 text-xs font-medium whitespace-nowrap text-gray-700 transition-colors sm:text-sm dark:text-gray-300"
                >
                  {post.title}
                </Link>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewsTicker
