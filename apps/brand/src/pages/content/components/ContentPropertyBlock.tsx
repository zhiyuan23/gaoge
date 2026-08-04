import type { ReactNode } from 'react'

import MatrixStatus from '@/brand/components/MatrixStatus'
import MediaWithFallback from '@/brand/components/MediaWithFallback'
import PlatformRail from '@/pages/content/components/PlatformRail'
import type { ContentProperty } from '@/pages/content/data'

interface ContentPropertyBlockProps {
  readonly property: ContentProperty
  readonly size: 'hero' | 'portrait' | 'wide'
}

const sizeClasses = {
  hero: 'lg:col-span-7 lg:row-span-2',
  portrait: 'lg:col-span-5 lg:row-span-2',
  wide: 'lg:col-span-5',
} as const

function PropertyContent({ property }: { readonly property: ContentProperty }): ReactNode {
  return (
    <>
      <MediaWithFallback
        alt={property.visual?.alt ?? `${property.name} 内容视觉`}
        className="min-h-64"
        fallbackLabel={property.name}
        {...(property.visual ? { src: property.visual.src } : {})}
      />
      <div className="flex flex-col gap-4 p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-2xl font-medium tracking-[-0.05em] text-white">{property.name}</h3>
          <MatrixStatus context="content" status={property.status} />
        </div>
        <p className="text-sm leading-7 text-[rgb(var(--brand-muted))]">{property.summary}</p>
        <PlatformRail platforms={property.platforms} />
      </div>
    </>
  )
}

export default function ContentPropertyBlock({ property, size }: ContentPropertyBlockProps) {
  const className = `flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[rgb(var(--brand-surface)/0.72)] ${sizeClasses[size]}`

  if (property.href) {
    return (
      <a
        aria-label={`${property.name}，打开品牌站点`}
        className={`${className} transition-transform duration-300 hover:-translate-y-0.5 hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-0`}
        href={property.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <PropertyContent property={property} />
      </a>
    )
  }

  return <article className={className}>{<PropertyContent property={property} />}</article>
}
