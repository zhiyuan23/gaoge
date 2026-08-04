import { useEffect, useState } from 'react'

interface MediaWithFallbackProps {
  readonly alt: string
  readonly className?: string
  readonly fallbackLabel: string
  readonly src?: string
}

export default function MediaWithFallback({
  alt,
  className = '',
  fallbackLabel,
  src,
}: MediaWithFallbackProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    <div
      className={`remote-image-fallback relative flex min-h-56 items-center justify-center overflow-hidden rounded-[24px] ${className}`}
    >
      {src && !failed ? (
        <img
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          src={src}
        />
      ) : (
        <span className="px-6 text-center text-sm font-medium tracking-[0.16em] text-white/80">
          {fallbackLabel}
        </span>
      )}
    </div>
  )
}
