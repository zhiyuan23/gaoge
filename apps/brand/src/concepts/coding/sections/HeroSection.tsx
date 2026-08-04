import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import WordsPullUp from '@/concepts/coding/components/WordsPullUp'
import { navigationItems } from '@/concepts/coding/data'

const heroVideo =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4'
const revealEase = [0.16, 1, 0.3, 1] as const

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="prisma-hero" className="relative h-screen bg-black p-4 md:p-6">
      <div className="relative h-full overflow-hidden rounded-2xl bg-black md:rounded-[2rem]">
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          src={heroVideo}
        />
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        <nav
          aria-label="Prisma primary navigation"
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-2xl bg-black px-4 py-2 md:rounded-b-3xl md:px-8"
        >
          <ul className="flex items-center gap-3 whitespace-nowrap sm:gap-6 md:gap-12 lg:gap-14">
            {navigationItems.map((item) => (
              <li key={item}>
                <a
                  className="text-[10px] text-[rgba(225,224,204,0.8)] transition-colors hover:text-[#E1E0CC] sm:text-xs md:text-sm"
                  href={`#${item.toLowerCase().replaceAll(' ', '-')}`}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 sm:px-6 sm:pb-7 md:px-8 md:pb-8">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12 md:gap-6">
            <h1
              aria-label="Prisma"
              className="col-span-1 text-[26vw] font-medium leading-[0.85] tracking-[-0.07em] text-[#E1E0CC] sm:text-[24vw] md:col-span-8 md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]"
            >
              <WordsPullUp showAsterisk text="Prisma" />
            </h1>

            <div className="col-span-1 flex flex-col items-start gap-4 pb-1 md:col-span-4 md:gap-6 md:pb-[1.2vw]">
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="text-primary/70 max-w-md text-xs leading-[1.2] sm:text-sm md:text-base"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                transition={{
                  delay: shouldReduceMotion ? 0 : 0.5,
                  duration: 0.8,
                  ease: revealEase,
                }}
              >
                Prisma is a worldwide network of visual artists, filmmakers and storytellers bound
                not by place, status or labels but by passion and hunger to unlock potential through
                our unique perspectives.
              </motion.p>

              <motion.a
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary group inline-flex items-center gap-2 whitespace-nowrap rounded-full py-1 pl-5 pr-1 text-sm font-medium text-black transition-[gap,transform] hover:gap-3 active:scale-[0.98] sm:pl-6 sm:text-base"
                href="#prisma-about"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                transition={{
                  delay: shouldReduceMotion ? 0 : 0.7,
                  duration: 0.8,
                  ease: revealEase,
                }}
              >
                Join the lab
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                  <ArrowRight
                    aria-hidden="true"
                    className="text-primary h-4 w-4 sm:h-5 sm:w-5"
                    strokeWidth={1.75}
                  />
                </span>
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
