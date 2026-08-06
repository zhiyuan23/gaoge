import { describe, expect, it } from 'vitest'

import { groupIndustries, groupLeaders, leagueDirectors, sportsEntities } from './data'

describe('group organization data', () => {
  it('keeps confirmed industry names and destinations', () => {
    expect(groupIndustries).toEqual([
      expect.objectContaining({ href: '/digital', id: 'digital', name: '高歌数字' }),
      expect.objectContaining({
        alias: '高歌小绿本',
        href: '/content',
        id: 'content',
        name: '高歌内容',
      }),
      expect.objectContaining({
        href: 'https://sports.gaoge.cc',
        id: 'sports',
        name: '高歌体育',
        target: '_blank',
      }),
      expect.objectContaining({
        id: 'future',
        name: '未来领域',
        status: 'future',
      }),
    ])
    expect(groupIndustries.find(({ id }) => id === 'future')?.href).toBeUndefined()
  })

  it('keeps sports entities parallel and truthful', () => {
    expect(sportsEntities.map(({ name }) => name)).toEqual(['高歌 FC', '高歌超级联赛'])
  })

  it('contains the six confirmed leadership placeholders', () => {
    expect(groupLeaders).toHaveLength(6)
    expect(groupLeaders.map(({ scope }) => scope)).toEqual([
      'group',
      'digital',
      'content',
      'sports',
      'club',
      'league',
    ])
  })

  it('contains exactly twenty uniquely ordered league directors', () => {
    expect(leagueDirectors).toHaveLength(20)
    expect(leagueDirectors.map(({ seat }) => seat)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    )
    expect(leagueDirectors.map(({ nickname }) => nickname)).toEqual([
      '劳塔罗',
      '皮耶罗',
      '吉格斯',
      '赵继伟',
      '睡皮',
      '欧文',
      '托雷斯',
      '阿兰',
      '巴雷西',
      '齐达内',
      '奥纳纳',
      '方昊',
      '安东尼',
      '肥罗',
      '伊尔迪兹',
      '巴蒂',
      '博格坎普',
      '福登',
      '浩克',
      '宋凯',
    ])
    expect(leagueDirectors.every(({ nickname }) => Array.from(nickname).length <= 4)).toBe(true)
    expect(new Set(leagueDirectors.map(({ id }) => id))).toHaveProperty('size', 20)
  })
})
