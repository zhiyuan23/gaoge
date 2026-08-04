import { useReducedMotion } from 'framer-motion'
import { type RefObject, useEffect, useRef } from 'react'

import ImageWithFallback from '@/concepts/creator/components/ImageWithFallback'
import { marqueeTracks } from '@/concepts/creator/data'

interface MarqueeRowProps {
  readonly images: readonly string[]
  readonly rowLabel: string
  readonly trackRef: RefObject<HTMLDivElement>
}

function MarqueeRow({ images, rowLabel, trackRef }: MarqueeRowProps) {
  return (
    <div className="w-max -translate-x-1/3">
      <div ref={trackRef} className="flex w-max gap-3" style={{ willChange: 'transform' }}>
        {images.map((src, index) => (
          <ImageWithFallback
            key={`${src}-${index}`}
            alt={`${rowLabel} showcase ${index + 1}`}
            className="h-[270px] w-[420px] shrink-0 rounded-2xl object-cover"
            decoding="async"
            loading="lazy"
            src={src}
          />
        ))}
      </div>
    </div>
  )
}

export default function MarqueeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const rowOneRef = useRef<HTMLDivElement>(null)
  const rowTwoRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    const rowOne = rowOneRef.current
    const rowTwo = rowTwoRef.current

    if (!section || !rowOne || !rowTwo || reduceMotion) {
      return
    }

    let frameId = 0

    const updateTracks = () => {
      frameId = 0
      const sectionTop = section.getBoundingClientRect().top + window.scrollY
      const offset = (window.scrollY - sectionTop + window.innerHeight) * 0.3

      rowOne.style.transform = `translate3d(${offset - 200}px, 0, 0)`
      rowTwo.style.transform = `translate3d(${-1 * (offset - 200)}px, 0, 0)`
    }

    const scheduleUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateTracks)
      }
    }

    updateTracks()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate, { passive: true })

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)

      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [reduceMotion])

  return (
    <section
      ref={sectionRef}
      aria-label="Selected animated work"
      className="bg-ink overflow-hidden pb-10 pt-24 sm:pt-32 md:pt-40"
    >
      <div className="flex flex-col gap-3">
        <MarqueeRow images={marqueeTracks.rowOne} rowLabel="First row" trackRef={rowOneRef} />
        <MarqueeRow images={marqueeTracks.rowTwo} rowLabel="Second row" trackRef={rowTwoRef} />
      </div>
    </section>
  )
}
