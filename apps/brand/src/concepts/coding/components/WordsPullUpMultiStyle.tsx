import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

export interface StyledTextSegment {
  readonly className?: string
  readonly text: string
}

interface WordsPullUpMultiStyleProps {
  readonly className?: string
  readonly segments: readonly StyledTextSegment[]
}

const pullUpEase = [0.16, 1, 0.3, 1] as const

export default function WordsPullUpMultiStyle({
  className = '',
  segments,
}: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const shouldReduceMotion = useReducedMotion()
  const words = segments.flatMap((segment) =>
    segment.text.split(' ').map((word) => ({
      className: segment.className ?? '',
      word,
    })),
  )

  return (
    <span ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {words.map(({ className: wordClassName, word }, index) => (
        <span
          key={`${word}-${index}`}
          className={`mr-[0.24em] inline-block overflow-hidden last:mr-0 ${wordClassName}`}
        >
          <motion.span
            animate={shouldReduceMotion || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            className="inline-block pb-[0.08em]"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            transition={{
              delay: shouldReduceMotion ? 0 : index * 0.08,
              duration: 0.7,
              ease: pullUpEase,
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
