import { motion, type MotionProps, useReducedMotion } from 'framer-motion'

export default function ContentHero() {
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
  const imageMotion: MotionProps = reducedMotion
    ? {}
    : {
        animate: { scale: 1.045 },
        initial: { scale: 1.015 },
        transition: { duration: 9, ease: [0.16, 1, 0.3, 1] },
      }

  return (
    <section
      className="content-page-section content-hero mx-auto grid min-h-[calc(100dvh-4.25rem)] max-w-[1600px] items-center gap-8 px-6 pb-16 pt-12 max-[359px]:gap-5 max-[359px]:px-5 max-[359px]:pb-8 max-[359px]:pt-7 md:min-h-[calc(100dvh-5rem)] md:px-10 md:pb-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 lg:pt-8"
      id="content-overview"
    >
      <motion.div className="relative z-10 max-w-xl" {...copyMotion}>
        <h1 className="text-xs font-medium tracking-[0.2em] text-[rgb(var(--brand-accent))]">
          GAOGE CONTENT
        </h1>
        <h2
          aria-label="让每一份热爱持续被看见。"
          className="font-display-cn mt-5 max-w-xl text-5xl font-medium leading-[0.98] tracking-[-0.025em] text-white max-[359px]:text-4xl sm:text-6xl lg:text-5xl xl:text-7xl"
        >
          让每一份热爱
          <br />
          持续被看见。
        </h2>
        <p className="mt-7 max-w-md text-sm leading-7 text-[rgb(var(--brand-muted))]">
          以内容与运营连接品牌、平台和真实社群。
        </p>
      </motion.div>

      <motion.figure
        className="content-hero-source relative min-h-[24rem] overflow-hidden max-[359px]:min-h-56 sm:min-h-[30rem] lg:min-h-[34rem]"
        {...visualMotion}
      >
        <motion.img
          alt="夜间球场灯光下的真实赛事现场"
          className="content-hero-source-image absolute inset-0 h-full w-full object-cover object-center"
          decoding="async"
          loading="eager"
          height="1086"
          src="/assets/brand/content-league-atmosphere.jpg"
          width="1448"
          {...imageMotion}
        />
        <div aria-hidden="true" className="content-hero-source-shade absolute inset-0" />
      </motion.figure>
    </section>
  )
}
