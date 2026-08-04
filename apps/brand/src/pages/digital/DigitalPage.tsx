import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import DigitalDirectory from '@/pages/digital/components/DigitalDirectory'
import FeaturedProduct from '@/pages/digital/components/FeaturedProduct'
import {
  digitalCapabilities,
  digitalDirectory,
  featuredDigitalProducts,
} from '@/pages/digital/data'

export default function DigitalPage() {
  const reducedMotion = useReducedMotion()

  useBrandMetadata({
    description: '高歌数字旗下企业软件、消费者应用与平台能力。',
    title: '高歌数字 - 数字产品矩阵',
  })

  return (
    <BrandPageShell current="digital" crossLink={{ label: '进入高歌内容', to: '/content' }}>
      <section className="relative mx-auto flex min-h-[100dvh] max-w-7xl items-end px-6 pb-20 pt-36 md:px-10 md:pb-24">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <h1 className="mb-5 text-xs uppercase tracking-[0.24em] text-[rgb(var(--brand-accent))]">
            GAOGE DIGITAL
          </h1>
          <h2 className="max-w-3xl text-5xl font-medium tracking-[-0.07em] text-white md:text-8xl">
            让复杂业务有清晰系统。
          </h2>
          <p className="mt-7 max-w-md text-sm leading-7 text-[rgb(var(--brand-muted))]">
            企业软件、消费者应用与平台能力，按真实边界逐步交付。
          </p>
          <Link
            className="mt-10 inline-flex rounded-full border border-white/20 px-5 py-3 text-sm text-white transition-colors hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            to="#featured"
          >
            查看重点产品
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28" id="featured">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
              Product Focus
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">
              重点产品
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-6 text-[rgb(var(--brand-muted))] md:block">
            只展示已有明确边界的产品方向。
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-[minmax(15rem,1fr)_minmax(15rem,1fr)]">
          {featuredDigitalProducts.map((product, index) => (
            <FeaturedProduct
              emphasis={index === 0 ? 'primary' : 'secondary'}
              key={product.name}
              product={product}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
            Product Matrix
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">
            完整产品矩阵
          </h2>
        </div>
        <DigitalDirectory products={digitalDirectory} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
            Delivery Boundary
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">
            交付边界
          </h2>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4 border-y border-white/10 py-6 text-sm text-[rgb(var(--brand-muted))] md:gap-x-12 md:text-base">
          {digitalCapabilities.map((capability) => (
            <span key={capability}>{capability}</span>
          ))}
        </div>
      </section>
    </BrandPageShell>
  )
}
