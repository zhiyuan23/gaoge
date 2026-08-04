import { describe, expect, it } from 'vitest'

import { digitalProducts } from '@/pages/digital/data'

describe('digital product matrix', () => {
  it('keeps Compass as the only confirmed live external product', () => {
    const linkedProducts = digitalProducts.filter(({ href }) => href)

    expect(linkedProducts).toEqual([
      expect.objectContaining({
        href: 'https://compass.gaoge.cc',
        name: '高歌跨境 ERP',
        status: 'live',
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
})
