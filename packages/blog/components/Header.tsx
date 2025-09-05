import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'
import Image from './Image'

const Header = () => {
  let headerClass = 'flex items-center w-full bg-white dark:bg-gray-950 py-10'
  if (siteMetadata.stickyNav) {
    headerClass += ' sticky top-0 z-50'
  }

  return (
    <header className={headerClass}>
      {/* Left spacer for balance */}
      <div className="flex-1"></div>

      {/* Center logo */}
      <Link href="/" aria-label="vektr.news" className="flex-shrink-0">
        <Image
          src="/static/images/vektr-logo.png"
          alt="vektr.news"
          width={600}
          height={600}
          className="h-12 w-auto dark:invert"
        />
      </Link>

      {/* Right navigation */}
      <div className="flex flex-1 items-center justify-end space-x-4 leading-5 sm:space-x-6">
        <div className="no-scrollbar hidden max-w-40 items-center gap-x-4 overflow-x-auto sm:flex md:max-w-72 lg:max-w-96">
          {headerNavLinks
            .filter((link) => link.href !== '/')
            .map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="hover:text-primary-500 dark:hover:text-primary-400 m-1 font-medium text-gray-900 dark:text-gray-100"
              >
                {link.title}
              </Link>
            ))}
        </div>
        <SearchButton />
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
