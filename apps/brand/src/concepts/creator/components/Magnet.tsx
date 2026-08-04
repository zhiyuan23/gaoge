import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion'
import { type ReactNode, useCallback, useEffect, useRef } from 'react'

interface MagnetProps {
  readonly activeTransition?: string
  readonly children: ReactNode
  readonly className?: string
  readonly inactiveTransition?: string
  readonly padding?: number
  readonly strength?: number
}

export default function Magnet({
  activeTransition = 'transform 0.3s ease-out',
  children,
  className,
  inactiveTransition = 'transform 0.6s ease-in-out',
  padding = 150,
  strength = 3,
}: MagnetProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const magneticRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`
  const reduceMotion = useReducedMotion()

  const reset = useCallback(() => {
    if (magneticRef.current) {
      magneticRef.current.style.transition = inactiveTransition
    }
    x.set(0)
    y.set(0)
  }, [inactiveTransition, x, y])

  useEffect(() => {
    if (reduceMotion) {
      reset()
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const wrapper = wrapperRef.current
      const magnetic = magneticRef.current

      if (!wrapper || !magnetic) {
        return
      }

      if (window.innerWidth < 640 || !window.matchMedia('(pointer: fine)').matches) {
        reset()
        return
      }

      const rect = wrapper.getBoundingClientRect()
      const withinRange =
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding

      if (!withinRange) {
        reset()
        return
      }

      magnetic.style.transition = activeTransition
      x.set((event.clientX - (rect.left + rect.width / 2)) / strength)
      y.set((event.clientY - (rect.top + rect.height / 2)) / strength)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('blur', reset)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', reset)
      reset()
    }
  }, [activeTransition, padding, reduceMotion, reset, strength, x, y])

  return (
    <div ref={wrapperRef} className={className}>
      <motion.div ref={magneticRef} style={{ transform, willChange: 'transform' }}>
        {children}
      </motion.div>
    </div>
  )
}
