import { describe, expect, it } from 'vitest'

import { contentProperties } from '@/pages/content/data'

describe('content operation matrix', () => {
  it('only publishes the confirmed sports destination', () => {
    expect(contentProperties.filter(({ href }) => href)).toEqual([
      expect.objectContaining({
        href: 'https://sports.gaoge.cc',
        name: '高歌体育',
        status: 'live',
      }),
    ])
  })

  it('does not invent links for the league or personal IP', () => {
    ;['高歌超级联赛', '主理人个人 IP'].forEach((name) => {
      expect(contentProperties.find((property) => property.name === name)?.href).toBeUndefined()
    })
  })

  it('uses only configured platform identifiers', () => {
    const platforms = contentProperties.flatMap(({ platforms }) => platforms)
    expect(platforms).toEqual(
      expect.arrayContaining([
        'wechat',
        'channels',
        'xiaohongshu',
        'douyin',
        'bilibili',
        'community',
      ]),
    )
  })
})
