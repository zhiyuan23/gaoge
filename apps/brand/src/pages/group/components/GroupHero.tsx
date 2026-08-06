import { motion, useReducedMotion } from 'framer-motion'

import IndustryOrbit from '@/pages/group/components/IndustryOrbit'
import type { GroupIndustry } from '@/pages/group/types'

interface GroupHeroProps {
  readonly industries: readonly GroupIndustry[]
}

export default function GroupHero({ industries }: GroupHeroProps) {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative isolate mx-auto grid min-h-[calc(100dvh-5rem)] max-w-[1600px] items-center overflow-hidden px-6 pb-16 pt-12 md:px-10 md:pb-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 lg:pt-8">
      <img
        alt="深色金属与绿玻璃构成的弧形建筑结构"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-45 lg:object-right"
        decoding="async"
        height="991"
        loading="eager"
        src="/assets/brand/group-architecture.webp"
        width="1587"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(12_15_13_/_0.98)_0%,rgb(12_15_13_/_0.9)_38%,rgb(12_15_13_/_0.42)_72%,rgb(12_15_13_/_0.76)_100%)]" />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-xl pb-10 pt-8 lg:pb-0"
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-xs font-medium tracking-[0.2em] text-[rgb(var(--brand-accent))]">
          GAOGE GROUP
        </h1>
        <h2
          aria-label="连接热爱，生长事业。"
          className="mt-5 max-w-lg text-5xl font-medium leading-[0.98] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl"
        >
          连接热爱，
          <br />
          生长事业。
        </h2>
        <p className="mt-7 max-w-sm text-sm leading-7 text-[rgb(var(--brand-muted))]">
          让不同事业彼此连接，共同走向更远的地方。
        </p>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 min-w-0"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
        transition={{ delay: reducedMotion ? 0 : 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <IndustryOrbit industries={industries} />
      </motion.div>
    </section>
  )
}
