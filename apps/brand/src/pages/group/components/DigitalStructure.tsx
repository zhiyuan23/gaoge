import { ArrowUpRight } from 'lucide-react'

import type { GroupDigitalProduct } from '@/pages/group/types'

interface DigitalStructureProps {
  readonly products: readonly GroupDigitalProduct[]
}

function DigitalProductCard({ product }: { readonly product: GroupDigitalProduct }) {
  const isPrimary = product.emphasis === 'primary'
  const sizeClassName = isPrimary
    ? 'h-72 p-6 md:p-7 lg:col-span-7 lg:row-span-2 lg:h-full'
    : 'h-36 p-4 lg:col-span-5 lg:h-full lg:p-6'

  return (
    <a
      aria-label={`${product.name}，进入演示系统，将在新窗口打开`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[rgb(var(--brand-surface)/0.72)] transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--brand-accent))] active:translate-y-0 active:scale-[0.985] ${sizeClassName}`}
      data-emphasis={product.emphasis}
      data-product={product.id}
      data-testid="group-digital-product"
      href={product.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute rounded-full bg-[rgb(var(--brand-accent)/0.1)] blur-3xl ${
          isPrimary ? '-right-20 -top-24 h-72 w-72' : '-right-12 -top-16 h-40 w-40'
        }`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] tracking-[0.18em] text-white/45 md:text-xs">
            {product.englishName}
          </p>
          <span className="inline-flex rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55 md:px-3 md:py-1 md:text-xs">
            演示系统
          </span>
        </div>
        <span
          className={`grid shrink-0 place-items-center rounded-full border border-white/10 text-white/45 transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:text-white ${
            isPrimary ? 'h-9 w-9' : 'h-8 w-8'
          }`}
        >
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />
        </span>
      </div>
      <div className="relative">
        <h3
          className={`font-medium tracking-[-0.05em] text-white ${
            isPrimary ? 'text-3xl md:text-5xl' : 'text-xl lg:text-3xl'
          }`}
        >
          {product.name}
        </h3>
        <p
          className={`text-[rgb(var(--brand-muted))] ${
            isPrimary
              ? 'mt-3 max-w-xl text-sm leading-6'
              : 'mt-1 text-xs leading-5 lg:mt-2 lg:text-sm lg:leading-6'
          }`}
        >
          {product.description}
        </p>
      </div>
    </a>
  )
}

export default function DigitalStructure({ products }: DigitalStructureProps) {
  return (
    <section
      aria-labelledby="digital-structure-title"
      className="group-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
      id="group-digital"
    >
      <div className="max-w-2xl">
        <p className="mb-4 text-sm text-[rgb(var(--brand-accent))]">以数字连接业务</p>
        <h2
          className="text-4xl font-medium tracking-[-0.06em] text-white md:text-6xl"
          id="digital-structure-title"
        >
          高歌数字
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))] md:text-base">
          从真实业务出发，把复杂流程变成清晰、可持续使用的数字产品。
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:mt-12 lg:grid-cols-12 lg:grid-rows-[12.5rem_12.5rem]">
        {products.map((product) => (
          <DigitalProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
