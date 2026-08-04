import { motion, useReducedMotion } from 'framer-motion'

import FeatureCard from '@/concepts/coding/components/FeatureCard'
import WordsPullUpMultiStyle from '@/concepts/coding/components/WordsPullUpMultiStyle'
import { featureCards } from '@/concepts/coding/data'

const featureVideo =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4'
const cardEase = [0.22, 1, 0.36, 1] as const

export default function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      id="prisma-features"
      className="relative min-h-screen overflow-hidden bg-black px-4 py-24 sm:px-6 md:py-32"
    >
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.15]" />

      <div className="relative mx-auto max-w-[1600px]">
        <h2
          aria-label="Studio-grade workflows for visionary creators. Built for pure vision. Powered by art."
          className="max-w-4xl text-xl font-normal sm:text-2xl md:text-3xl lg:text-4xl"
        >
          <span className="block text-[#E1E0CC]">
            <WordsPullUpMultiStyle
              className="justify-start"
              segments={[{ text: 'Studio-grade workflows for visionary creators.' }]}
            />
          </span>
          <span className="mt-1 block text-gray-500">
            <WordsPullUpMultiStyle
              className="justify-start"
              segments={[{ text: 'Built for pure vision. Powered by art.' }]}
            />
          </span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:mt-16 sm:gap-2 md:grid-cols-2 md:gap-1 lg:h-[480px] lg:grid-cols-4">
          <motion.article
            className="relative min-h-[520px] overflow-hidden bg-[#212121] md:min-h-[440px] lg:min-h-0"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.8,
              ease: cardEase,
            }}
            viewport={{ margin: '-100px', once: true }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <video
              aria-hidden="true"
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              loop
              muted
              playsInline
              src={featureVideo}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
            <p className="absolute inset-x-0 bottom-0 p-5 text-lg text-[#E1E0CC] sm:p-6 sm:text-xl">
              Your creative canvas.
            </p>
          </motion.article>

          {featureCards.map((card, index) => (
            <FeatureCard key={card.number} card={card} index={index + 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
