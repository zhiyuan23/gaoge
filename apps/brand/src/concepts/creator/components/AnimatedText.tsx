import { motion, type MotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedCharacterProps {
  readonly character: string
  readonly end: number
  readonly progress: MotionValue<number>
  readonly start: number
}

function AnimatedCharacter({ character, end, progress, start }: AnimatedCharacterProps) {
  const opacity = useTransform(progress, [start, end], [0.2, 1])
  const visibleCharacter = character === ' ' ? '\u00A0' : character

  return (
    <span className="relative inline-block">
      <span aria-hidden="true" className="opacity-0">
        {visibleCharacter}
      </span>
      <motion.span aria-hidden="true" className="absolute inset-0" style={{ opacity }}>
        {visibleCharacter}
      </motion.span>
    </span>
  )
}

interface AnimatedTextProps {
  readonly className?: string
  readonly text: string
}

export default function AnimatedText({ className, text }: AnimatedTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  })
  const characters = Array.from(text)
  const words = text.split(' ')

  if (reduceMotion) {
    return (
      <p ref={containerRef} className={className}>
        {text}
      </p>
    )
  }

  return (
    <p ref={containerRef} aria-label={text} className={className}>
      {words.map((word, wordIndex) => {
        const precedingText = words.slice(0, wordIndex).join(' ')
        const characterOffset = precedingText.length + (wordIndex > 0 ? 1 : 0)

        return (
          <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap">
            {Array.from(word).map((character, characterIndex) => {
              const index = characterOffset + characterIndex
              const start = index / characters.length
              const end = Math.min(1, start + 1 / characters.length)

              return (
                <AnimatedCharacter
                  key={`${character}-${index}`}
                  character={character}
                  end={end}
                  progress={scrollYProgress}
                  start={start}
                />
              )
            })}
            {wordIndex < words.length - 1 ? '\u00A0' : null}
          </span>
        )
      })}
    </p>
  )
}
