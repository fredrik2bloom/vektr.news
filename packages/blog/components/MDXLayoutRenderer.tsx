import React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import type { MDXComponents } from 'mdx/types'

interface MDXLayoutRendererProps {
  code: string
  components?: MDXComponents
  toc?: any
  [key: string]: any
}

export function MDXLayoutRenderer({ code, components, ...rest }: MDXLayoutRendererProps) {
  const Component = React.useMemo(() => {
    // Create a function from the compiled MDX code
    const scope: Record<string, any> = { React, _jsx_runtime: jsxRuntime, ...(components || {}) }
    const fn = new Function(...Object.keys(scope), code)
    return fn(...Object.values(scope)).default
  }, [code, components])

  return <Component {...rest} />
}
