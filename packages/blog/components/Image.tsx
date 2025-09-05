'use client'

import { useState } from 'react'
import NextImage, { ImageProps } from 'next/image'

const basePath = process.env.BASE_PATH

interface CustomImageProps extends Omit<ImageProps, 'onError'> {
  src: string
}

const Image = ({ src, ...rest }: CustomImageProps) => {
  const [imgSrc, setImgSrc] = useState(`${basePath || ''}${src}`)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(`${basePath || ''}/static/images/media-unavailable.png`)
    }
  }

  return <NextImage src={imgSrc} onError={handleError} {...rest} />
}

export default Image
