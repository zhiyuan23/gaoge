import { useReducedMotion, useScroll } from 'framer-motion'
import { useRef } from 'react'

import AnimatedLetter from '@/concepts/coding/components/AnimatedLetter'

interface ScrollRevealTextProps {
  readonly className?: string
  readonly text: string
}

export default function ScrollRevealText({ className = '', text }: ScrollRevealTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })
  const lastCharacterIndex = Math.max(text.length - 1, 1)

  return (
    <p ref={ref} aria-label={text} className={className}>
      <span aria-hidden="true">
        {Array.from(text).map((character, index) => {
          const characterProgress = index / lastCharacterIndex
          const range: [number, number] = [
            Math.max(0, characterProgress - 0.1),
            Math.min(1, characterProgress + 0.05),
          ]

          return (
            <AnimatedLetter
              key={`${character}-${index}`}
              character={character}
              progress={scrollYProgress}
              range={range}
              reducedMotion={Boolean(shouldReduceMotion)}
            />
          )
        })}
      </span>
    </p>
  )
}
