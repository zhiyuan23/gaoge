import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

import MatrixStatus from '@/brand/components/MatrixStatus'
import type { DigitalProduct } from '@/pages/digital/data'

interface CurrentProductsProps {
  readonly products: readonly DigitalProduct[]
}

function ProductCopy({ product }: { readonly product: DigitalProduct }) {
  return (
    <div className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          {product.englishName ? (
            <p className="text-xs tracking-[0.12em] text-white/[0.42]">{product.englishName}</p>
          ) : null}
          <h3 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-white">
            {product.name}
          </h3>
        </div>
        <MatrixStatus context="digital" status={product.status} />
      </div>
      <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))]">
        {product.summary}
      </p>
      <ul className="mt-auto flex flex-wrap gap-2 pt-7" aria-label={`${product.name} 产品标签`}>
        {product.tags.map((tag) => (
          <li
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55"
            key={tag}
          >
            {tag}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PrimaryProduct({ product }: { readonly product: DigitalProduct }): ReactNode {
  if (!product.href)
    return (
      <article className="digital-current-primary">
        <ProductCopy product={product} />
      </article>
    )

  return (
    <a
      aria-label={`${product.name}，进入演示系统，将在新窗口打开`}
      className="digital-current-primary group overflow-hidden transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--brand-accent))] active:scale-[0.985]"
      href={product.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="grid h-full md:grid-cols-[0.92fr_1.08fr]">
        <div className="relative min-h-72 overflow-hidden border-b border-white/10 md:min-h-[28rem] md:border-b-0 md:border-r">
          <img
            alt="深色玻璃与金属模块构成的产品材质近景"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.015]"
            decoding="async"
            height="1086"
            loading="lazy"
            src="/assets/brand/digital-product-module.jpg"
            width="1448"
          />
        </div>
        <div className="relative">
          <ProductCopy product={product} />
          <span className="absolute bottom-6 right-6 grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/50 transition-[background-color,border-color,color,transform] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:text-white sm:bottom-7 sm:right-7">
            <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </a>
  )
}

function SecondaryProduct({ product }: { readonly product: DigitalProduct }): ReactNode {
  if (!product.href)
    return (
      <article className="digital-current-secondary">
        <ProductCopy product={product} />
      </article>
    )

  return (
    <a
      aria-label={`${product.name}，进入演示系统，将在新窗口打开`}
      className="digital-current-secondary group relative block transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--brand-accent))] active:translate-y-0 active:scale-[0.985]"
      href={product.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ProductCopy product={product} />
      <span className="absolute bottom-6 right-6 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/45 transition-[background-color,border-color,color,transform] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-white/20 group-hover:bg-white/[0.06] group-hover:text-white sm:bottom-7 sm:right-7">
        <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />
      </span>
    </a>
  )
}

export default function CurrentProducts({ products }: CurrentProductsProps) {
  const [primaryProduct, ...secondaryProducts] = products

  if (!primaryProduct) return null

  return (
    <section
      className="digital-page-section mx-auto max-w-[1440px] scroll-mt-32 px-6 py-16 md:px-10 md:py-24"
      id="digital-current"
    >
      <header className="max-w-2xl">
        <h2 className="font-display-cn text-3xl font-medium tracking-[-0.025em] text-white md:text-5xl">
          当前产品
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-[rgb(var(--brand-muted))]">
          先展示已经运行和正在建设的产品，状态、边界与入口清晰可见。
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <PrimaryProduct product={primaryProduct} />
        <div className="grid gap-4 lg:grid-rows-2">
          {secondaryProducts.map((product) => (
            <SecondaryProduct key={product.name} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
