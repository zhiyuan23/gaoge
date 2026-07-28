import { describe, expect, it } from 'vitest'

import { homepageSections } from './homepage'

describe('homepageSections', () => {
  it('defines the current five homepage sections', () => {
    expect(homepageSections).toHaveLength(5)
    expect(homepageSections[0]).toMatchObject({
      id: '1',
      kicker: 'Gaoge Sports',
      title: '高歌',
    })
    expect(homepageSections.map((section) => section.title)).toEqual([
      '高歌',
      '实力',
      '拼搏',
      '精神',
      '传奇',
    ])
    expect(homepageSections.every((section) => section.image)).toBe(true)
    expect(homepageSections.every((section) => section.description.length > 0)).toBe(true)
  })
})
