'use client'

import { useState } from 'react'
import NextImage, { ImageProps } from 'next/image'
import { getBackupImage } from '@/utils/backupImages'

const basePath = process.env.BASE_PATH

interface CustomImageProps extends Omit<ImageProps, 'onError'> {
  src: string
  // Optional slug to select a consistent backup image when the primary src fails
  fallbackSlug?: string
}

const Image = ({ src, fallbackSlug, ...rest }: CustomImageProps) => {
  const [imgSrc, setImgSrc] = useState(`${basePath || ''}${src}`)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      const backup = getBackupImage(fallbackSlug || 'default')
      setImgSrc(`${basePath || ''}${backup}`)
    }
  }

  return <NextImage src={imgSrc} onError={handleError} {...rest} />
}

export default Image
