const { withContentlayer } = require('next-contentlayer2')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// You might need to insert additional domains in script-src if you are using external services
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' giscus.app analytics.umami.is;
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src *.s3.amazonaws.com;
  connect-src *;
  font-src 'self';
  frame-src giscus.app
`

const securityHeaders = [
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const output = process.env.EXPORT ? 'export' : undefined
const basePath = process.env.BASE_PATH || undefined
const unoptimized = process.env.UNOPTIMIZED ? true : undefined

/**
 * @type {import('next/dist/next-server/server/config').NextConfig}
 **/
module.exports = () => {
  const plugins = [withContentlayer, withBundleAnalyzer]
  return plugins.reduce((acc, next) => next(acc), {
    output,
    basePath,
    reactStrictMode: true,
    trailingSlash: false,
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    eslint: {
      dirs: ['app', 'components', 'layouts', 'scripts'],
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },
        // Crypto news sites - main domains
        {
          protocol: 'https',
          hostname: '**.cryptoslate.com',
        },
        {
          protocol: 'https',
          hostname: '**.coindesk.com',
        },
        {
          protocol: 'https',
          hostname: '**.cointelegraph.com',
        },
        {
          protocol: 'https',
          hostname: '**.decrypt.co',
        },
        {
          protocol: 'https',
          hostname: '**.bitcoinist.com',
        },
        {
          protocol: 'https',
          hostname: '**.theblockcrypto.com',
        },
        {
          protocol: 'https',
          hostname: '**.beincrypto.com',
        },
        {
          protocol: 'https',
          hostname: '**.bitcoin.com',
        },
        {
          protocol: 'https',
          hostname: '**.cryptonews.com',
        },
        {
          protocol: 'https',
          hostname: '**.ambcrypto.com',
        },
        {
          protocol: 'https',
          hostname: '**.u.today',
        },
        {
          protocol: 'https',
          hostname: '**.coincodex.com',
        },
        {
          protocol: 'https',
          hostname: '**.cryptopotato.com',
        },
        // Common CDNs and AWS buckets used by crypto sites
        {
          protocol: 'https',
          hostname: '**.amazonaws.com',
        },
        {
          protocol: 'https',
          hostname: '**.s3.amazonaws.com',
        },
        // Additional crypto news domains
        {
          protocol: 'https',
          hostname: '**.coingecko.com',
        },
        {
          protocol: 'https',
          hostname: '**.coinmarketcap.com',
        },
        {
          protocol: 'https',
          hostname: '**.blockworks.co',
        },
        {
          protocol: 'https',
          hostname: '**.dlnews.com',
        },
        {
          protocol: 'https',
          hostname: '**.newsbtc.com',
        },
        {
          protocol: 'https',
          hostname: '**.coinjournal.net',
        },
        {
          protocol: 'https',
          hostname: '**.cryptocurrencynews.com',
        },
        {
          protocol: 'https',
          hostname: '**.cryptobriefing.com',
        },
        {
          protocol: 'https',
          hostname: '**.cryptoslate.com',
        },
        {
          protocol: 'https',
          hostname: '**.coinspeaker.com',
        },
        {
          protocol: 'https',
          hostname: '**.finbold.com',
        },
        {
          protocol: 'https',
          hostname: '**.crypto-news-flash.com',
        },
        {
          protocol: 'https',
          hostname: '**.tbstat.com',
        },
        {
          protocol: 'https',
          hostname: '**.sanity.io',
        },
        // Catch-all for crypto-related domains
        {
          protocol: 'https',
          hostname: '**crypto**.com',
        },
        {
          protocol: 'https',
          hostname: '**bitcoin**.com',
        },
        {
          protocol: 'https',
          hostname: '**coin**.com',
        },
      ],
      unoptimized,
    },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: securityHeaders,
        },
      ]
    },
    webpack: (config, options) => {
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      })

      return config
    },
  })
}
