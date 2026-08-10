import { motion, type MotionProps, useReducedMotion } from 'framer-motion'

import type { ContentCapability } from '@/pages/content/data'

interface ContentCapabilitiesProps {
  readonly capabilities: readonly ContentCapability[]
}

const capabilityOffsets = [
  { x: -18, y: -12 },
  { x: 18, y: -8 },
  { x: 16, y: 12 },
  { x: -14, y: 16 },
] as const

export default function ContentCapabilities({ capabilities }: ContentCapabilitiesProps) {
  const reducedMotion = useReducedMotion()
  const itemMotion = (index: number): MotionProps => {
    const offset = capabilityOffsets[index] ?? { x: 0, y: 0 }

    return reducedMotion
      ? {}
      : {
          initial: { opacity: 0, x: offset.x, y: offset.y },
          transition: {
            delay: index * 0.06,
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          },
          viewport: { amount: 0.45, once: true },
          whileInView: { opacity: 1, x: 0, y: 0 },
        }
  }

  return (
    <section
      className="content-page-section content-capability-field mx-auto min-h-[100dvh] max-w-[1600px] px-6 py-24 md:px-10"
      data-testid="content-capabilities"
      id="content-capabilities"
    >
      <div aria-hidden="true" className="content-capability-core">
        内容
      </div>
      <div className="content-capability-items">
        {capabilities.map((capability, index) => (
          <motion.article
            className="content-capability-item"
            data-capability-index={index + 1}
            data-testid="content-capability"
            key={capability.title}
            {...itemMotion(index)}
          >
            <h2>{capability.title}</h2>
            <p>{capability.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
