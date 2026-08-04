import type { MotionValue } from 'framer-motion'
import { motion, useTransform } from 'framer-motion'

interface AnimatedLetterProps {
  readonly character: string
  readonly progress: MotionValue<number>
  readonly range: [number, number]
  readonly reducedMotion: boolean
}

export default function AnimatedLetter({
  character,
  progress,
  range,
  reducedMotion,
}: AnimatedLetterProps) {
  const opacity = useTransform(progress, range, [0.2, 1])

  return (
    <motion.span style={{ opacity: reducedMotion ? 1 : opacity }}>
      {character === ' ' ? '\u00a0' : character}
    </motion.span>
  )
}
