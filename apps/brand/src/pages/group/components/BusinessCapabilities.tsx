import type { BusinessCapability } from '@/pages/group/types'

interface BusinessCapabilitiesProps {
  readonly capabilities: readonly BusinessCapability[]
}

export default function BusinessCapabilities({ capabilities }: BusinessCapabilitiesProps) {
  return (
    <section
      aria-labelledby="business-capabilities-title"
      className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28"
    >
      <div className="max-w-2xl">
        <h2
          className="font-display-cn text-4xl font-medium tracking-[-0.025em] text-white md:text-6xl"
          id="business-capabilities-title"
        >
          企业服务能力
        </h2>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
          三个事业群可以独立签约和交付，也可以围绕同一业务目标共同协作。
        </p>
      </div>

      <div className="border-white/12 mt-12 border-t md:mt-16">
        {capabilities.map((capability) => (
          <article
            className="border-white/12 grid gap-7 border-b py-9 md:grid-cols-[0.78fr_1.22fr] md:gap-14 md:py-12"
            data-business-capability={capability.id}
            key={capability.id}
          >
            <div>
              <h3 className="text-3xl font-medium tracking-[-0.05em] text-white md:text-4xl">
                {capability.name}
              </h3>
              <p className="mt-3 text-sm text-[rgb(var(--brand-accent))]">
                {capability.positioning}
              </p>
            </div>

            <div>
              <p className="text-white/72 max-w-xl text-base leading-8">{capability.description}</p>
              <ul className="mt-7 grid list-disc gap-x-10 gap-y-3 pl-5 text-sm text-white/55 sm:grid-cols-2">
                {capability.capabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <p className="text-white/58 mt-9 max-w-3xl border-l border-[rgb(var(--brand-accent))] pl-5 text-sm leading-7">
        围绕账号持续更新的内容与日常视觉由高歌内容负责，以独立专业影像作品为主要交付物的项目由高歌影视负责。
      </p>
    </section>
  )
}
