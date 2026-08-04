import { type ComponentType, lazy, type LazyExoticComponent } from 'react'

export interface BrandConcept {
  readonly component: LazyExoticComponent<ComponentType>
  readonly description: string
  readonly name: string
  readonly slug: string
}

export const concepts = [
  {
    component: lazy(() => import('@/concepts/skiing/SkiingPage')),
    description: '以数字、内容、体育与未来为方向的高歌品牌封面。',
    name: 'Skiing',
    slug: 'skiing',
  },
  {
    component: lazy(() => import('@/concepts/coding/CodingPage')),
    description: '面向创意工作流的内容与工具概念。',
    name: 'Coding',
    slug: 'coding',
  },
  {
    component: lazy(() => import('@/concepts/creator/CreatorPage')),
    description: '以 3D 创作者作品集为核心的长页概念。',
    name: 'Creator',
    slug: 'creator',
  },
] as const satisfies readonly BrandConcept[]

export const homepageConceptSlug = 'skiing' satisfies (typeof concepts)[number]['slug']

export const legacyConceptRoutes = [
  { from: 'securify', to: 'skiing' },
  { from: 'prisma', to: 'coding' },
  { from: 'jack-3d', to: 'creator' },
] as const

export function getConceptPath(slug: string) {
  return `/concepts/${slug}`
}
