import type { ReactNode } from 'react'

import MatrixStatus from '@/brand/components/MatrixStatus'
import MediaWithFallback from '@/brand/components/MediaWithFallback'
import type { DigitalProduct } from '@/pages/digital/data'

interface FeaturedProductProps {
  readonly emphasis: 'primary' | 'secondary'
  readonly product: DigitalProduct
}

function ProductContent({ product }: { readonly product: DigitalProduct }): ReactNode {
  return (
    <>
      <MediaWithFallback
        alt={product.visual?.alt ?? `${product.name} 产品视觉`}
        className="min-h-64"
        fallbackLabel={product.englishName ?? product.name}
        {...(product.visual ? { src: product.visual.src } : {})}
      />
      <div className="flex flex-1 flex-col gap-4 p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--brand-muted))]">
              {product.englishName ?? 'Gaoge Product'}
            </p>
            <h3 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-white">
              {product.name}
            </h3>
          </div>
          <MatrixStatus context="digital" status={product.status} />
        </div>
        <p className="max-w-xl text-sm leading-7 text-[rgb(var(--brand-muted))]">
          {product.summary}
        </p>
        <ul className="mt-auto flex flex-wrap gap-2" aria-label={`${product.name} 产品标签`}>
          {product.tags.map((tag) => (
            <li
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60"
              key={tag}
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function FeaturedProduct({ emphasis, product }: FeaturedProductProps) {
  const className = `group flex min-h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[rgb(var(--brand-surface)/0.72)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-white/25 active:translate-y-0 ${
    emphasis === 'primary' ? 'lg:col-span-7 lg:row-span-2' : 'lg:col-span-5'
  }`

  if (product.href) {
    return (
      <a
        aria-label={`${product.name}，打开产品站点`}
        className={className}
        href={product.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ProductContent product={product} />
      </a>
    )
  }

  return (
    <article className={className}>
      <ProductContent product={product} />
    </article>
  )
}
