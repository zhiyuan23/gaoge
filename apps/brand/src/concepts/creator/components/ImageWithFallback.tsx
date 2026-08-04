import { type ImgHTMLAttributes, useState } from 'react'

interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  readonly fallbackClassName?: string
}

export default function ImageWithFallback({
  alt = '',
  className = '',
  fallbackClassName = '',
  ...imageProps
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        aria-label={alt || undefined}
        className={`remote-image-fallback block ${className} ${fallbackClassName}`}
        role={alt ? 'img' : undefined}
      />
    )
  }

  return <img {...imageProps} alt={alt} className={className} onError={() => setFailed(true)} />
}
