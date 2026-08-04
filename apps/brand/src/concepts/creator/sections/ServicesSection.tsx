import FadeIn from '@/concepts/creator/components/FadeIn'
import { services } from '@/concepts/creator/data'

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="text-ink rounded-t-[40px] bg-white px-5 py-20 sm:rounded-t-[50px] sm:px-8 sm:py-24 md:rounded-t-[60px] md:px-10 md:py-32"
    >
      <FadeIn y={40}>
        <h2 className="mb-16 text-center text-[clamp(3rem,12vw,160px)] font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-28">
          Services
        </h2>
      </FadeIn>

      <div className="border-ink/15 mx-auto max-w-5xl border-y">
        {services.map((service, index) => (
          <FadeIn
            key={service.number}
            as="article"
            className="border-ink/15 grid grid-cols-[72px_minmax(0,1fr)] items-start gap-5 border-b py-8 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-8 sm:py-10 md:grid-cols-[180px_minmax(0,1fr)] md:gap-12 md:py-12"
            delay={index * 0.1}
            y={30}
          >
            <p className="text-[clamp(3rem,10vw,140px)] font-black leading-[0.8] tracking-tight">
              {service.number}
            </p>
            <div className="pt-1 sm:pt-2 md:pt-3">
              <h3 className="text-[clamp(1rem,2.2vw,2.1rem)] font-medium uppercase leading-tight">
                {service.name}
              </h3>
              <p className="mt-3 max-w-2xl text-[clamp(0.85rem,1.6vw,1.25rem)] font-light leading-relaxed opacity-60 sm:mt-4">
                {service.description}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
