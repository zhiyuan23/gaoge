import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface DigitalSectionRevealProps {
  readonly children: ReactNode
}

export default function DigitalSectionReveal({ children }: DigitalSectionRevealProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="digital-section-reveal"
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0.64,
              transform: 'translate3d(0, 18px, 0)',
            }
      }
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
      viewport={{ amount: 0.12, margin: '-64px 0px', once: true }}
      whileInView={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
    >
      {children}
    </motion.div>
  )
}
