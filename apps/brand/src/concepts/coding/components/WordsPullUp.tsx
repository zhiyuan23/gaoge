import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface WordsPullUpProps {
  readonly className?: string
  readonly showAsterisk?: boolean
  readonly text: string
}

const pullUpEase = [0.16, 1, 0.3, 1] as const

export default function WordsPullUp({
  className = '',
  showAsterisk = false,
  text,
}: WordsPullUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const shouldReduceMotion = useReducedMotion()
  const words = text.split(' ')

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, index) => {
        const isLastWord = index === words.length - 1

        return (
          <span
            key={`${word}-${index}`}
            className={`relative mr-[0.24em] inline-block last:mr-0 ${
              showAsterisk && isLastWord ? 'overflow-visible' : 'overflow-hidden'
            }`}
          >
            <motion.span
              animate={
                shouldReduceMotion || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              className="relative inline-block"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              transition={{
                delay: shouldReduceMotion ? 0 : index * 0.08,
                duration: 0.7,
                ease: pullUpEase,
              }}
            >
              {word}
              {showAsterisk && isLastWord ? (
                <span
                  aria-hidden="true"
                  className="absolute -right-[0.3em] top-[0.65em] text-[0.31em]"
                >
                  *
                </span>
              ) : null}
            </motion.span>
          </span>
        )
      })}
    </span>
  )
}
