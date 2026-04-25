import type { DateTimeString } from './common.js'

/** 轮播图状态。inactive 记录不应出现在公开列表中。 */
export type BannerStatus = 'active' | 'inactive'

/**
 * 轮播图信息。
 *
 * @property id 轮播图 ID。
 * @property title 标题。
 * @property imageUrl 图片 URL。
 * @property linkUrl 点击跳转 URL。
 * @property sort 排序值，数值越大越靠前。
 * @property status 轮播图状态。
 * @property createdAt 创建时间。
 * @property updatedAt 更新时间。
 */
export interface Banner {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  sort: number
  status: BannerStatus
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

/**
 * 创建轮播图时的提交参数。
 *
 * @property title 标题。
 * @property imageUrl 图片 URL。
 * @property linkUrl 点击跳转 URL。
 * @property sort 排序值，数值越大越靠前。
 * @property status 轮播图状态，未提供时由后端使用默认状态。
 */
export interface BannerPayload {
  title: string
  imageUrl: string
  linkUrl?: string
  sort?: number
  status?: BannerStatus
}

/** 更新轮播图时的提交参数。 */
export type UpdateBannerPayload = Partial<BannerPayload>
