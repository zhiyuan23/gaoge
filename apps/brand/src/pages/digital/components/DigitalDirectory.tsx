import MatrixStatus from '@/brand/components/MatrixStatus'
import type { DigitalCategory, DigitalProduct } from '@/pages/digital/data'

interface DigitalDirectoryProps {
  readonly products: readonly DigitalProduct[]
}

const categoryLabels = {
  consumer: '消费者与体育产品',
  enterprise: '企业软件',
  platform: '平台能力',
} as const satisfies Record<DigitalCategory, string>

const categoryStyles = {
  consumer: 'lg:col-span-3',
  enterprise: 'lg:col-span-5',
  platform: 'lg:col-span-4',
} as const satisfies Record<DigitalCategory, string>

const categoryOrder: readonly DigitalCategory[] = ['enterprise', 'consumer', 'platform']

export default function DigitalDirectory({ products }: DigitalDirectoryProps) {
  if (!products.length) {
    return <p className="text-sm text-white/60">数字产品矩阵正在整理中</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {categoryOrder.map((category) => {
        const categoryProducts = products.filter((product) => product.category === category)

        return (
          <section className={categoryStyles[category]} key={category}>
            <h3 className="mb-4 text-sm font-medium tracking-[0.08em] text-[rgb(var(--brand-accent))]">
              {categoryLabels[category]}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {categoryProducts.map((product) => (
                <article
                  className="rounded-[18px] border border-white/10 bg-[rgb(var(--brand-surface)/0.45)] p-4"
                  key={product.name}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-sm font-medium text-white">{product.name}</h4>
                    <MatrixStatus context="digital" status={product.status} />
                  </div>
                  <p className="mt-2 text-xs leading-6 text-[rgb(var(--brand-muted))]">
                    {product.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
