import type { DateTimeString } from './common.js'

/** 轮播图状态。`inactive` 不应出现在公开列表中。 */
export type BannerStatus = 'active' | 'inactive'

/** 轮播图跳转类型。 */
export type BannerJumpType = 'none' | 'webview' | 'miniapp'

/** 轮播图基础信息。 */
export interface Banner {
  id: number
  title: string
  imageUrl: string
  jumpType: BannerJumpType
  jumpUrl: string | null
  sort: number
  status: BannerStatus
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

/** 创建或更新轮播图时的提交参数。 */
export interface BannerPayload {
  title: string
  imageUrl: string
  jumpType: BannerJumpType
  jumpUrl?: string
  sort?: number
  status?: BannerStatus
}

export type UpdateBannerPayload = Partial<BannerPayload>
