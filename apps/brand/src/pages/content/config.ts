export const contentBrandName = {
  english: 'GAOGE CONTENT',
  chinese: '高歌内容',
} as const

export type ContentPlatform =
  | 'wechat'
  | 'channels'
  | 'xiaohongshu'
  | 'douyin'
  | 'bilibili'
  | 'community'

export const platformLabels = {
  bilibili: 'B 站',
  channels: '视频号',
  community: '社群与私域',
  douyin: '抖音',
  wechat: '公众号',
  xiaohongshu: '小红书',
} as const satisfies Record<ContentPlatform, string>
