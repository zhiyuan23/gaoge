import AnimatedText from '@/concepts/creator/components/AnimatedText'
import ContactButton from '@/concepts/creator/components/ContactButton'
import FadeIn from '@/concepts/creator/components/FadeIn'
import ImageWithFallback from '@/concepts/creator/components/ImageWithFallback'
import { aboutDecorations, aboutText } from '@/concepts/creator/data'

export default function AboutSection() {
  return (
    <section
      id="about"
      className="bg-ink relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 py-20 sm:px-8 md:px-10"
    >
      {aboutDecorations.map((image) => (
        <FadeIn
          key={image.src}
          className={`${image.className} z-0`}
          delay={image.delay}
          duration={0.9}
          x={image.x}
          y={0}
        >
          <ImageWithFallback
            alt={image.alt}
            className="block h-auto w-full"
            decoding="async"
            loading="lazy"
            src={image.src}
          />
        </FadeIn>
      ))}

      <div className="relative z-10 flex w-full flex-col items-center gap-10 sm:gap-14 md:gap-16">
        <FadeIn delay={0} y={40}>
          <h2 className="hero-heading text-center text-[clamp(3rem,12vw,160px)] font-black uppercase leading-none tracking-tight">
            About me
          </h2>
        </FadeIn>

        <div className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24">
          <AnimatedText
            className="text-mist max-w-[560px] text-center text-[clamp(1rem,2vw,1.35rem)] font-medium leading-relaxed"
            text={aboutText}
          />
          <div id="contact">
            <ContactButton />
          </div>
        </div>
      </div>
    </section>
  )
}
