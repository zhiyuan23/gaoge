import { motion, type MotionProps, useReducedMotion } from 'framer-motion'

const beliefLines = ['内容不是一次传播。', '它让故事持续发生，', '让关系慢慢留下。'] as const

export default function ContentBelief() {
  const reducedMotion = useReducedMotion()
  const lineMotion = (index: number): MotionProps =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          transition: {
            delay: index * 0.08,
            duration: 0.52,
            ease: [0.16, 1, 0.3, 1],
          },
          viewport: { amount: 0.6, once: true },
          whileInView: { opacity: 1, y: 0 },
        }

  return (
    <section
      className="content-page-section content-belief-manifesto mx-auto flex min-h-[82dvh] max-w-[1600px] items-center px-6 py-24 md:px-10"
      data-testid="content-belief"
      id="content-belief"
    >
      <h2
        aria-label="内容不是一次传播。它让故事持续发生，让关系慢慢留下。"
        className="font-display-cn max-w-6xl text-5xl font-medium leading-[1.02] tracking-[-0.025em] text-white md:text-7xl lg:text-8xl"
      >
        {beliefLines.map((line, index) => (
          <motion.span
            aria-hidden="true"
            className={index === 1 ? 'content-belief-accent' : undefined}
            key={line}
            {...lineMotion(index)}
          >
            {line}
          </motion.span>
        ))}
      </h2>
    </section>
  )
}
