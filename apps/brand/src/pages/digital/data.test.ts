import { describe, expect, it } from 'vitest'

import {
  digitalCapabilities,
  digitalCategoryOrder,
  digitalProducts,
  featuredDigitalProducts,
  plannedDigitalProducts,
} from '@/pages/digital/data'

describe('digital product matrix', () => {
  it('links every current product to its demo system', () => {
    const linkedProducts = digitalProducts.filter(({ href }) => href)

    expect(linkedProducts).toEqual([
      expect.objectContaining({
        href: 'https://compass.gaoge.cc?demo',
        name: '高歌跨境 ERP',
        status: 'live',
      }),
      expect.objectContaining({
        href: 'https://crm.gaoge.cc?demo',
        name: '高歌客户 CRM',
        status: 'building',
      }),
      expect.objectContaining({
        href: 'https://club.gaoge.cc?demo',
        name: '高歌 Club',
        status: 'building',
      }),
    ])
  })

  it('does not give planned products a destination', () => {
    expect(digitalProducts.filter(({ status }) => status === 'planned')).not.toEqual([])
    digitalProducts
      .filter(({ status }) => status === 'planned')
      .forEach((product) => expect(product.href).toBeUndefined())
  })

  it('covers enterprise, consumer and platform categories', () => {
    expect(new Set(digitalProducts.map(({ category }) => category))).toEqual(
      new Set(['enterprise', 'consumer', 'platform']),
    )
  })

  it('separates current products from future product plans', () => {
    expect(featuredDigitalProducts.map(({ name, status }) => ({ name, status }))).toEqual([
      { name: '高歌跨境 ERP', status: 'live' },
      { name: '高歌客户 CRM', status: 'building' },
      { name: '高歌 Club', status: 'building' },
    ])
    expect(plannedDigitalProducts.every(({ status }) => status === 'planned')).toBe(true)
    expect(plannedDigitalProducts.map(({ name }) => name)).not.toContain('多端交付')
  })

  it('defines roadmap family order and delivery capabilities', () => {
    expect(digitalCategoryOrder).toEqual(['enterprise', 'consumer', 'platform'])
    expect(digitalCapabilities).toContain('多端交付')
    expect(digitalCapabilities).toContain('后续 SaaS')
  })
})
