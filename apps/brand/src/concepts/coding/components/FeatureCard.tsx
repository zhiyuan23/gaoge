import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'

import type { FeatureCardData } from '@/concepts/coding/data'

interface FeatureCardProps {
  readonly card: FeatureCardData
  readonly index: number
}

const cardEase = [0.22, 1, 0.36, 1] as const

export default function FeatureCard({ card, index }: FeatureCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.article
      className="flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#212121] p-5 sm:min-h-[440px] sm:p-6 lg:min-h-0"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      transition={{
        delay: shouldReduceMotion ? 0 : index * 0.15,
        duration: 0.8,
        ease: cardEase,
      }}
      viewport={{ margin: '-100px', once: true }}
      whileInView={{ opacity: 1, scale: 1 }}
    >
      <img
        alt=""
        className="h-10 w-10 rounded object-cover sm:h-12 sm:w-12"
        decoding="async"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.visibility = 'hidden'
        }}
        src={card.imageUrl}
      />

      <div>
        <h3 className="flex items-start justify-between gap-5 text-xl leading-tight text-[#E1E0CC] sm:text-2xl">
          <span>{card.title}</span>
          <span className="text-primary/60 text-xs font-light">{card.number}</span>
        </h3>

        <ul className="mt-7 space-y-3">
          {card.checklist.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-xs leading-snug text-gray-400">
              <Check
                aria-hidden="true"
                className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0"
                strokeWidth={1.75}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <a
          className="text-primary group mt-8 inline-flex items-center gap-2 text-xs transition-opacity hover:opacity-70"
          href="#prisma-about"
        >
          Learn more
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 -rotate-45 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={1.75}
          />
        </a>
      </div>
    </motion.article>
  )
}
