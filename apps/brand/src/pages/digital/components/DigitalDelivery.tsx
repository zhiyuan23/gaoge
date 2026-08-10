interface DigitalDeliveryProps {
  readonly capabilities: readonly string[]
}

export default function DigitalDelivery({ capabilities }: DigitalDeliveryProps) {
  return (
    <section
      className="digital-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
      id="digital-delivery"
    >
      <h2 className="font-display-cn text-3xl font-medium tracking-[-0.025em] text-white md:text-5xl">
        产品如何被交付
      </h2>
      <div className="digital-delivery-model mt-10 grid gap-10 p-7 sm:p-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:p-12">
        <p className="font-display-cn max-w-md text-3xl font-medium leading-[1.08] tracking-[-0.025em] text-white sm:text-4xl">
          清晰边界，持续演进。
        </p>
        <ul className="grid gap-x-8 gap-y-4 text-sm text-[rgb(var(--brand-muted))] sm:grid-cols-2">
          {capabilities.map((capability) => (
            <li className="border-t border-white/10 pt-4" key={capability}>
              {capability}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
