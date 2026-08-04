import { motion, useReducedMotion } from 'framer-motion'
import { type ElementType, type ReactNode, useMemo } from 'react'

interface FadeInProps {
  readonly as?: ElementType
  readonly children: ReactNode
  readonly className?: string
  readonly delay?: number
  readonly duration?: number
  readonly x?: number
  readonly y?: number
}

const easing = [0.25, 0.1, 0.25, 1] as const

export default function FadeIn({
  as = 'div',
  children,
  className,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
}: FadeInProps) {
  const reduceMotion = useReducedMotion()
  const MotionElement = useMemo(() => motion.create(as), [as])

  return (
    <MotionElement
      className={className}
      initial={reduceMotion ? false : { opacity: 0, x, y }}
      transition={{ delay, duration, ease: easing }}
      viewport={{ amount: 0, margin: '50px', once: true }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
    >
      {children}
    </MotionElement>
  )
}
