/* eslint-disable jsx-a11y/anchor-has-content */
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { AnchorHTMLAttributes, ReactNode } from 'react'

const CustomLink = ({
  href,
  children,
  ...rest
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode }) => {
  const hrefStr = typeof href === 'string' ? href : ''
  const isInternalLink = hrefStr.startsWith('/')
  const isAnchorLink = hrefStr.startsWith('#')

  if (isInternalLink) {
    return (
      <Link className="break-words" href={href} {...rest}>
        {children}
      </Link>
    )
  }

  if (isAnchorLink) {
    return (
      <a className="break-words" href={hrefStr} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <a
      className="break-words"
      target="_blank"
      rel="noopener noreferrer"
      href={hrefStr}
      {...rest}
    >
      {children}
    </a>
  )
}

export default CustomLink
