import { motion, type MotionProps, useReducedMotion } from 'framer-motion'

export default function DigitalHero() {
  const reducedMotion = useReducedMotion()
  const copyMotion: MotionProps = reducedMotion
    ? {}
    : {
        animate: { opacity: 1, y: 0 },
        initial: { opacity: 0, y: 18 },
        transition: { bounce: 0, duration: 0.4, type: 'spring' },
      }
  const visualMotion: MotionProps = reducedMotion
    ? {}
    : {
        animate: { opacity: 1, scale: 1 },
        initial: { opacity: 0, scale: 0.985 },
        transition: { bounce: 0, delay: 0.08, duration: 0.44, type: 'spring' },
      }

  return (
    <section
      className="digital-page-section digital-hero mx-auto grid min-h-[calc(100dvh-4.25rem)] max-w-[1600px] items-center gap-8 px-6 pb-16 pt-12 md:min-h-[calc(100dvh-5rem)] md:px-10 md:pb-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:pt-8"
      id="digital-overview"
    >
      <motion.div className="relative z-10 max-w-xl" {...copyMotion}>
        <h1 className="text-xs font-medium tracking-[0.2em] text-[rgb(var(--brand-accent))]">
          GAOGE DIGITAL
        </h1>
        <h2
          aria-label="让复杂业务，运行得更清晰。"
          className="font-display-cn mt-5 max-w-xl text-5xl font-medium leading-[0.98] tracking-[-0.025em] text-white max-[399px]:text-[2.75rem] max-[359px]:text-4xl sm:text-6xl lg:text-5xl xl:text-7xl"
        >
          让复杂业务，
          <br />
          运行得更清晰。
        </h2>
        <p className="mt-7 max-w-sm text-sm leading-7 text-[rgb(var(--brand-muted))]">
          以技术与产品思维，把真实需求转化为持续演进的数字产品。
        </p>
      </motion.div>

      <motion.figure
        className="digital-product-hero-visual relative min-h-[24rem] overflow-hidden rounded-[24px] border border-white/10 sm:min-h-[30rem] lg:min-h-[34rem]"
        {...visualMotion}
      >
        <img
          alt="深色玻璃与金属模块构成的数字产品结构"
          className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
          decoding="async"
          height="992"
          loading="eager"
          src="/assets/brand/digital-product-architecture.jpg"
          width="1586"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgb(12_15_13/0.4),transparent_42%),linear-gradient(0deg,rgb(12_15_13/0.28),transparent_48%)]"
        />
      </motion.figure>
    </section>
  )
}
