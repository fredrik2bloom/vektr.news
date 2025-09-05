import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'
import Image from './Image'

export default function Footer() {
  return (
    <footer className="mt-20 w-full bg-gray-50 dark:bg-gray-900">
      {/* full-width background, centered content */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center">
              <Image
                src="/static/images/vektr-grey.png"
                alt="vektr.news"
                width={120}
                height={120}
                className="mr-3 h-8 w-auto"
              />
            </div>
            <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
              Your trusted source for the latest cryptocurrency news, market analysis, and
              blockchain technology updates.
            </p>
            <div className="flex space-x-4">{/* Social icons would go here */}</div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase dark:text-gray-100">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  All News
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase dark:text-gray-100">
              Categories
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/categories/bitcoin"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  Bitcoin
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/ethereum"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  Ethereum
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/altcoin"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  Alt Coins
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/defi"
                  className="hover:text-primary-600 dark:hover:text-primary-400 text-gray-600 dark:text-gray-400"
                >
                  DeFi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
          <div className="mx-auto max-w-4xl">
            <h4 className="mb-4 text-center text-sm font-semibold tracking-wider text-gray-900 uppercase dark:text-gray-100">
              Disclaimer
            </h4>
            <div className="space-y-2 text-center text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              <p>
                <strong>Market Information Disclaimer:</strong> vektr.news is not responsible for
                the accuracy, completeness, or timeliness of any market information, cryptocurrency
                prices, or financial data displayed on this website. All market data may be
                outdated, inaccurate, or delayed.
              </p>
              <p>
                <strong>Not Financial Advice:</strong> The content on vektr.news is for
                informational purposes only and should not be construed as financial, investment, or
                trading advice. We do not provide personalized investment recommendations or endorse
                any specific cryptocurrencies, tokens, or investment strategies.
              </p>
              <p>
                <strong>Investment Risks:</strong> Cryptocurrency investments carry significant risk
                and may result in the loss of your entire investment. Past performance does not
                guarantee future results. Always conduct your own research and consult with
                qualified financial advisors before making any investment decisions.
              </p>
              <p>
                <strong>User Responsibility:</strong> You are solely responsible for your investment
                decisions and any losses that may result. vektr.news, its authors, and affiliates
                disclaim all liability for any financial losses or damages arising from the use of
                information on this website.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
          <div className="flex flex-col items-center justify-center md:flex-row">
            <div className="mb-4 flex space-x-2 text-sm text-gray-500 md:mb-0 dark:text-gray-400">
              <div>{siteMetadata.author}</div>
              <div>{` • `}</div>
              <div>{`© ${new Date().getFullYear()}`}</div>
              <div>{` • `}</div>
              <span>{siteMetadata.title}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
