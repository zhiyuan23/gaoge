import { describe, expect, it } from 'vitest'

import {
  groupIndustries,
  groupLeaders,
  groupVisionItems,
  leagueDirectors,
  sportsEntities,
} from './data'

describe('group organization data', () => {
  it('keeps the four divisions aligned with the homepage brand statements', () => {
    expect(groupIndustries).toEqual([
      {
        description: '以技术与产品思维，把想法转化为面向未来的数字能力。',
        direction: '产品矩阵',
        id: 'digital',
        name: '高歌数字',
      },
      {
        description: '以创意与内容思维，把热爱转化为持续生长的影响力。',
        direction: '内容运营',
        id: 'content',
        name: '高歌内容',
      },
      {
        description: '以影像与叙事思维，把想法转化为承载情感与表达的光影作品。',
        direction: '影像创作',
        id: 'film',
        name: '高歌影视',
      },
      {
        description: '以运动与连接的力量，把热爱转化为真实发生的共同体验。',
        direction: '体育生态',
        id: 'sports',
        name: '高歌体育',
      },
    ])
    expect(groupIndustries.some(({ name }) => name.includes('小绿本'))).toBe(false)
  })

  it('keeps sports descriptions focused on people and shared experience', () => {
    expect(sportsEntities).toEqual([
      {
        description: '一群因足球相聚的伙伴，一起训练、比赛，也一起享受每一次上场。',
        id: 'club',
        name: '高歌足球俱乐部',
      },
      {
        description: '为球友们持续组织的联赛，让熟悉的人和新的伙伴都能在球场相见。',
        id: 'league',
        name: '高歌超级联赛',
      },
    ])
  })

  it('contains the three confirmed group leaders', () => {
    expect(groupLeaders.map(({ nickname, role }) => ({ nickname, role }))).toEqual([
      { nickname: '劳塔罗', role: '集团主席' },
      { nickname: '齐达内', role: '高歌足球俱乐部 CEO' },
      { nickname: '劳塔罗', role: '高歌超级联赛运营负责人' },
    ])
  })

  it('contains the three group vision statements', () => {
    expect(groupVisionItems.map(({ id }) => id)).toEqual(['passion', 'action', 'together'])
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
