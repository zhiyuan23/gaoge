import MatrixStatus from '@/brand/components/MatrixStatus'
import {
  digitalCategoryLabels,
  digitalCategoryOrder,
  type DigitalProduct,
} from '@/pages/digital/data'

interface ProductRoadmapProps {
  readonly products: readonly DigitalProduct[]
}

export default function ProductRoadmap({ products }: ProductRoadmapProps) {
  const groupedProducts = digitalCategoryOrder.map((category) => ({
    category,
    products: products.filter((product) => product.category === category),
  }))

  return (
    <section
      className="digital-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
      id="digital-roadmap"
    >
      <header className="max-w-2xl">
        <h2 className="font-display-cn text-3xl font-medium tracking-[-0.025em] text-white md:text-5xl">
          未来产品规划
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))]">
          按产品族展示规划，不把尚未交付的方向包装成现有能力。
        </p>
      </header>

      <div className="mt-10 grid gap-5 lg:grid-cols-12">
        {groupedProducts.map(({ category, products: categoryProducts }) => (
          <section
            className={`digital-roadmap-group ${
              category === 'enterprise'
                ? 'lg:col-span-12'
                : category === 'consumer'
                  ? 'lg:col-span-5'
                  : 'lg:col-span-7'
            }`}
            key={category}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-medium tracking-[-0.02em] text-[rgb(var(--brand-accent))]">
                {digitalCategoryLabels[category]}
              </h3>
              <MatrixStatus context="digital" status="planned" />
            </div>
            <div
              className={`mt-8 grid gap-x-7 gap-y-8 ${
                category === 'enterprise' ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2'
              }`}
            >
              {categoryProducts.map((product) => (
                <article className="border-t border-white/10 pt-5" key={product.name}>
                  <h4 className="text-base font-medium text-white">{product.name}</h4>
                  <p className="mt-3 text-sm leading-6 text-[rgb(var(--brand-muted))]">
                    {product.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
