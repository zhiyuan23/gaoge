import { useReducedMotion } from 'framer-motion'

import ContactButton from '@/concepts/creator/components/ContactButton'
import FadeIn from '@/concepts/creator/components/FadeIn'
import ImageWithFallback from '@/concepts/creator/components/ImageWithFallback'
import Magnet from '@/concepts/creator/components/Magnet'
import { heroPortraitUrl, navigationItems } from '@/concepts/creator/data'

export default function HeroSection() {
  const reduceMotion = useReducedMotion()

  const scrollToSection = (targetId: string) => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <section id="hero" className="bg-ink relative flex min-h-[100dvh] flex-col overflow-x-clip">
      <FadeIn
        as="nav"
        className="text-mist relative z-20 flex items-center justify-between px-6 pt-6 text-sm font-medium uppercase tracking-wider md:px-10 md:pt-8 md:text-lg lg:text-[1.4rem]"
        y={-20}
      >
        {navigationItems.map((item) => (
          <button
            key={item.label}
            className="transition-opacity duration-200 hover:opacity-70"
            type="button"
            onClick={() => scrollToSection(item.targetId)}
          >
            {item.label}
          </button>
        ))}
      </FadeIn>

      <div className="relative z-0 mt-6 overflow-hidden sm:mt-4 md:-mt-5">
        <FadeIn delay={0.15} y={40}>
          <h1 className="hero-heading w-full whitespace-nowrap text-[14vw] font-black uppercase leading-none tracking-tight sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw]">
            Hi, i&apos;m jack
          </h1>
        </FadeIn>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center sm:bottom-0 sm:top-auto sm:translate-y-0">
        <FadeIn delay={0.6} y={30}>
          <Magnet
            activeTransition="transform 0.3s ease-out"
            className="pointer-events-auto w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px]"
            inactiveTransition="transform 0.6s ease-in-out"
            padding={150}
            strength={3}
          >
            <ImageWithFallback
              alt="Jack, 3D creator"
              className="block h-auto w-full"
              decoding="async"
              loading="eager"
              src={heroPortraitUrl}
            />
          </Magnet>
        </FadeIn>
      </div>

      <div className="relative z-20 mt-auto flex items-end justify-between gap-5 px-6 pb-7 sm:pb-8 md:px-10 md:pb-10">
        <FadeIn delay={0.35} y={20}>
          <p className="text-mist max-w-[160px] text-[clamp(0.75rem,1.4vw,1.5rem)] font-light uppercase leading-snug tracking-wide sm:max-w-[220px] md:max-w-[260px]">
            a 3d creator driven by crafting striking and unforgettable projects
          </p>
        </FadeIn>

        <FadeIn delay={0.5} y={20}>
          <ContactButton onClick={() => scrollToSection('contact')} />
        </FadeIn>
      </div>
    </section>
  )
}
