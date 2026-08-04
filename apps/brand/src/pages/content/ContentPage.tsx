import { useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'

import BrandPageShell from '@/brand/components/BrandPageShell'
import { useBrandMetadata } from '@/brand/metadata'
import ContentPropertyBlock from '@/pages/content/components/ContentPropertyBlock'
import PlatformRail from '@/pages/content/components/PlatformRail'
import { contentBrandName } from '@/pages/content/config'
import { contentCapabilities, contentProperties } from '@/pages/content/data'

const backgroundVideo =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4'

const allPlatforms = [
  'wechat',
  'channels',
  'xiaohongshu',
  'douyin',
  'bilibili',
  'community',
] as const
const propertySizes = ['hero', 'wide', 'portrait'] as const

export default function ContentPage() {
  const reducedMotion = useReducedMotion()

  useBrandMetadata({
    description: '高歌旗下内容品牌、IP、多平台运营与社群能力。',
    title: '高歌内容 - 内容运营矩阵',
  })

  return (
    <BrandPageShell current="content" crossLink={{ label: '进入高歌数字', to: '/digital' }}>
      <section className="relative mx-auto flex min-h-[100dvh] max-w-7xl items-end overflow-hidden px-6 pb-20 pt-36 md:px-10 md:pb-24">
        <img
          alt="高歌体育品牌分享图"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          src="/assets/brand/gaoge-sports-share.jpg"
        />
        <video
          aria-hidden="true"
          autoPlay
          className={`content-motion-layer absolute inset-0 h-full w-full object-cover opacity-45 ${
            reducedMotion ? 'hidden' : ''
          }`}
          loop
          muted
          playsInline
          src={backgroundVideo}
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgb(30_24_24_/_0.96),rgb(30_24_24_/_0.48),rgb(30_24_24_/_0.82))]" />
        <div className="relative z-10">
          <h1 className="mb-5 text-xs uppercase tracking-[0.24em] text-[rgb(var(--brand-accent))]">
            {contentBrandName.english}
          </h1>
          <h2 className="max-w-3xl text-5xl font-medium tracking-[-0.07em] text-white md:text-8xl">
            让每一份热爱持续被看见。
          </h2>
          <p className="mt-7 max-w-md text-sm leading-7 text-[rgb(var(--brand-muted))]">
            真实品牌、内容生产与社群运营，沿着可复盘的路径持续发生。
          </p>
          <Link
            className="mt-10 inline-flex rounded-full border border-white/20 px-5 py-3 text-sm text-white transition-colors hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            to="#properties"
          >
            查看运营对象
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28" id="properties">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
            Content Properties
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">
            运营对象
          </h2>
        </div>
        {contentProperties.length ? (
          <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-[minmax(15rem,1fr)_minmax(15rem,1fr)]">
            {contentProperties.map((property, index) => (
              <ContentPropertyBlock
                key={property.name}
                property={property}
                size={propertySizes[index] ?? 'wide'}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/60">内容运营矩阵正在整理中</p>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
            Platform Matrix
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">
            平台矩阵
          </h2>
        </div>
        <PlatformRail platforms={allPlatforms} />
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[rgb(var(--brand-accent))]">
            Operating Loop
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white md:text-5xl">
            运营闭环
          </h2>
        </div>
        <ol className="grid gap-5 border-y border-white/10 py-6 md:grid-cols-3">
          {contentCapabilities.map((capability, index) => (
            <li className="flex gap-4 text-sm text-[rgb(var(--brand-muted))]" key={capability}>
              <span className="text-[rgb(var(--brand-accent))]">0{index + 1}</span>
              <span>{capability}</span>
            </li>
          ))}
        </ol>
      </section>
    </BrandPageShell>
  )
}
