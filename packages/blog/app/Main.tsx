'use client'

import { useState } from 'react'
import Link from '@/components/Link'
import Tag from '@/components/Tag'
import Image from '@/components/Image'
import ImageOverlay from '@/components/ImageOverlay'
import VectorVote from '@/components/TemperatureVote'
import NewsTicker from '@/components/NewsTicker'
import MarketTicker from '@/components/MarketTicker'
import RisingSection from '@/components/RisingSection'
import siteMetadata from '@/data/siteMetadata'
import { getArticleImage } from '@/utils/backupImages'
import { truncateTitle, getDisplaySummary } from '@/utils/textUtils'
import { getSeededOverlayClass } from '@/utils/overlayUtils'

// Simple date formatter as fallback
const formatDate = (date: string, locale: string = 'en-US') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const LATEST_NEWS_INITIAL = 3
const POSTS_PER_PAGE = 5

export default function Home({ posts }) {
  const [displayCount, setDisplayCount] = useState(LATEST_NEWS_INITIAL)

  const heroPost = posts[0]
  const remainingPosts = posts.slice(1)
  const displayPosts = remainingPosts.slice(0, displayCount)
  const hasMoreLatestNews = displayCount < Math.min(remainingPosts.length, POSTS_PER_PAGE)
  const hasMorePosts = displayCount < remainingPosts.length

  const loadMoreLatestNews = () => {
    setDisplayCount(POSTS_PER_PAGE)
  }

  const loadMorePosts = () => {
    setDisplayCount((prev) => Math.min(prev + POSTS_PER_PAGE, remainingPosts.length))
  }

  // Group posts by tags for category sections
  const getPostsByTag = (tag) => {
    return posts.filter((post) => post.tags?.includes(tag)).slice(0, 3)
  }

  const popularTags = ['bitcoin', 'ethereum', 'altcoin']
  return (
    <>
      {/* News Ticker */}
      <NewsTicker posts={posts} />

      {/* Market Ticker */}
      <MarketTicker />

      {/* Hero Article */}
      {heroPost && (
        <div className="py-12">
          <article className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-900">
            <div className="lg:grid lg:grid-cols-2 lg:gap-0">
              <div
                className={`dither-overlay relative h-64 lg:h-auto ${getSeededOverlayClass(heroPost.slug)}`}
              >
                <Image
                  src={getArticleImage(heroPost.images, heroPost.slug)}
                  alt={heroPost.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* <ImageOverlay /> */}
              </div>
              <div className="p-8 lg:p-12">
                <div className="mb-4 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <time dateTime={heroPost.date}>
                    {formatDate(heroPost.date, siteMetadata.locale)}
                  </time>
                  <span>•</span>
                  <span>Featured</span>
                </div>
                <h2 className="mb-4 text-2xl leading-8 font-bold tracking-tight text-gray-900 lg:text-3xl lg:leading-10 dark:text-gray-100">
                  <Link
                    href={heroPost.canonicalUrl || `/blog/${heroPost.slug}`}
                    className="hover:text-primary-600 dark:hover:text-primary-400 line-clamp-3 transition-colors"
                    title={heroPost.title}
                  >
                    {heroPost.title}
                  </Link>
                </h2>
                <div className="mb-4 flex flex-wrap gap-2">
                  {heroPost.tags?.slice(0, 3).map((tag) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
                <p className="mb-6 line-clamp-4 text-lg leading-7 text-gray-600 dark:text-gray-300">
                  {getDisplaySummary(heroPost, 'long')}
                </p>
                <Link
                  href={heroPost.canonicalUrl || `/blog/${heroPost.slug}`}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center font-medium transition-colors"
                >
                  Read full article
                  <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Rising Section */}
      <RisingSection posts={posts} />

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-xl leading-8 font-bold tracking-tight text-gray-900 sm:text-3xl sm:leading-9 md:text-4xl md:leading-12 dark:text-gray-100">
            Latest News
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {displayPosts.map((post) => {
            const { slug, date, title, summary, tags, images, canonicalUrl } = post
            return (
              <li key={slug} className="py-8">
                <article>
                  <div className="xl:grid xl:grid-cols-4 xl:items-start xl:gap-5">
                    <dl className="xl:col-span-1">
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </dl>
                    <div className="xl:col-span-3">
                      <div className="space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                        <div className="md:order-2 md:col-span-1">
                          <div
                            className={`dither-overlay relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-900 ${getSeededOverlayClass(slug)}`}
                          >
                            <Image
                              src={getArticleImage(images, slug)}
                              alt={title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                            />
                            {/* <ImageOverlay /> */}
                          </div>
                        </div>
                        <div className="space-y-3 md:order-1 md:col-span-2">
                          <div>
                            <h2 className="text-2xl leading-8 font-bold tracking-tight">
                              <Link
                                href={canonicalUrl || `/blog/${slug}`}
                                className="hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 text-gray-900 transition-colors dark:text-gray-100"
                                title={title}
                              >
                                {title}
                              </Link>
                            </h2>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {tags.slice(0, 4).map((tag) => (
                                <Tag key={tag} text={tag} />
                              ))}
                            </div>
                          </div>
                          <div className="prose line-clamp-3 max-w-none text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                            {getDisplaySummary(post, 'medium')}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-base leading-6 font-medium">
                              <Link
                                href={canonicalUrl || `/blog/${slug}`}
                                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center transition-colors"
                                aria-label={`Read more: \"${title}\"`}
                              >
                                Read more
                                <svg
                                  className="ml-1 h-4 w-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </Link>
                            </div>
                            <VectorVote articleId={slug} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
      {hasMoreLatestNews && displayCount < POSTS_PER_PAGE && (
        <div className="flex justify-center pt-8">
          <button onClick={loadMoreLatestNews} className="tilted-button">
            <span className="button-text">load more</span>
          </button>
        </div>
      )}
      {displayCount >= POSTS_PER_PAGE && hasMorePosts && (
        <div className="flex justify-center pt-8">
          <button
            onClick={loadMorePosts}
            className="bg-primary-500 hover:bg-primary-600 rounded-lg px-6 py-3 font-medium text-white transition-colors"
          >
            load more
          </button>
        </div>
      )}

      {/* Page Break */}
      <div className="my-16 border-t border-gray-300 dark:border-gray-600"></div>

      {/* Category-specific News Sections */}
      {popularTags.map((tag) => {
        const tagPosts = getPostsByTag(tag)
        if (tagPosts.length === 0) return null

        return (
          <div key={tag} className="mb-16">
            <div className="mb-8">
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {tag === 'bitcoin'
                  ? 'Bitcoin News'
                  : tag === 'ethereum'
                    ? 'Ethereum News'
                    : tag === 'altcoin'
                      ? 'Alt Coin News'
                      : `${tag} News`}
              </h2>
              <div className="bg-primary-500 h-1 w-20 rounded"></div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tagPosts.map((post) => {
                const { slug, date, title, summary, tags, images, canonicalUrl } = post
                return (
                  <article
                    key={slug}
                    className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900"
                  >
                    <div
                      className={`dither-overlay relative aspect-[16/9] overflow-hidden ${getSeededOverlayClass(slug)}`}
                    >
                      <Image
                        src={getArticleImage(images, slug)}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-6">
                      <div className="mb-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </div>
                      <h3 className="mb-3 text-lg leading-tight font-semibold text-gray-900 dark:text-gray-100">
                        <Link
                          href={canonicalUrl || `/blog/${slug}`}
                          className="hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 transition-colors"
                          title={title}
                        >
                          {title}
                        </Link>
                      </h3>
                      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        {getDisplaySummary(post, 'short')}
                      </p>
                      <div className="flex justify-center">
                        <VectorVote articleId={slug} />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Only change 'More Articles' button */}
            <div className="mt-8 flex justify-center">
              <Link href={`/categories/${tag}`} className="tilted-button inline-block">
                <span className="button-text inline-flex items-center">
                  more articles
                  <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        )
      })}
      {siteMetadata.newsletter?.provider && (
        <div className="flex items-center justify-center pt-4"></div>
      )}
    </>
  )
}
