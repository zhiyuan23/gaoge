import type { MatrixStatusValue } from '@/brand/components/MatrixStatus'
import type { ContentPlatform } from '@/pages/content/config'

export interface ContentProperty {
  readonly href?: string
  readonly name: string
  readonly platforms: readonly ContentPlatform[]
  readonly status: MatrixStatusValue
  readonly summary: string
  readonly type: 'brand' | 'ip'
  readonly visual?: {
    readonly alt: string
    readonly src: string
  }
}

export const contentProperties: readonly ContentProperty[] = [
  {
    href: 'https://sports.gaoge.cc',
    name: '高歌体育',
    platforms: ['wechat', 'channels', 'xiaohongshu', 'douyin', 'bilibili', 'community'],
    status: 'live',
    summary: '围绕体育热爱持续记录赛事、人物与现场。',
    type: 'brand',
    visual: {
      alt: '高歌体育品牌分享图',
      src: '/assets/brand/gaoge-sports-share.jpg',
    },
  },
  {
    name: '高歌超级联赛',
    platforms: ['channels', 'xiaohongshu', 'douyin', 'community'],
    status: 'building',
    summary: '面向自有赛事的内容表达与活动传播。',
    type: 'brand',
  },
  {
    name: '主理人个人 IP',
    platforms: ['wechat', 'channels', 'xiaohongshu', 'douyin', 'bilibili'],
    status: 'building',
    summary: '记录产品、内容与体育实践中的个人观察。',
    type: 'ip',
  },
]

export const contentCapabilities = [
  '内容策划',
  '图文与短视频生产',
  '多平台分发',
  '活动传播',
  '社群承接',
  '数据复盘',
] as const
