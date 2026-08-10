import type { DeliveryModel as DeliveryModelItem } from '@/pages/group/types'

interface DeliveryModelProps {
  readonly models: readonly DeliveryModelItem[]
}

export default function DeliveryModel({ models }: DeliveryModelProps) {
  return (
    <section
      aria-labelledby="delivery-model-title"
      className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28"
    >
      <div className="group-delivery-model border-white/12 grid gap-12 overflow-hidden rounded-[28px] border px-7 py-12 md:grid-cols-[0.76fr_1.24fr] md:gap-16 md:px-12 md:py-16">
        <div>
          <h2
            className="font-display-cn max-w-md text-4xl font-medium tracking-[-0.025em] text-white md:text-6xl"
            id="delivery-model-title"
          >
            集团协同交付
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[rgb(var(--brand-muted))]">
            从单项能力采购到跨事业群协作，集团负责让责任边界和交付关系保持清晰。
          </p>
        </div>

        <ol className="border-white/12 border-t">
          {models.map((model) => (
            <li className="border-white/12 border-b py-7" key={model.id}>
              <h3 className="text-xl font-medium tracking-[-0.03em] text-white">{model.name}</h3>
              <p className="text-white/58 mt-3 max-w-xl text-sm leading-7">{model.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
