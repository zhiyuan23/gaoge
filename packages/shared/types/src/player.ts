import type { DateTimeString } from './common.js'

/** 球员状态。当前允许历史或自定义状态值，因此暂时保持 string。 */
export type PlayerStatus = string

/**
 * 球员信息。
 *
 * @property id 球员记录 ID。
 * @property openid 微信 openid，兼容旧数据，运行时不再作为唯一绑定依据。
 * @property userId 已绑定的用户 ID，未绑定时为 null。
 * @property playerNumber 球员号码，当前业务要求全局唯一，范围 0~100。
 * @property nickname 昵称，当前作为球员唯一标识之一。
 * @property realName 真实姓名。
 * @property avatarUrl 头像 URL。
 * @property subTeam 子球队，多个值用逗号分隔。
 * @property jerseyName 球衣名称。
 * @property birthDate 出生日期，接口传输时使用 ISO 字符串。
 * @property isAdmin 是否为球队管理员。
 * @property position 足球位置。
 * @property jerseySize 球衣尺码。
 * @property status 球员状态。
 * @property remark 备注。
 * @property createdAt 创建时间。
 * @property updatedAt 更新时间。
 */
export interface Player {
  id: number
  openid: string | null
  userId: number | null
  playerNumber: number | null
  nickname: string
  realName: string | null
  avatarUrl: string | null
  subTeam: string | null
  jerseyName: string | null
  birthDate: DateTimeString | null
  isAdmin: boolean
  position: string | null
  jerseySize: string | null
  status: PlayerStatus
  remark: string | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

/**
 * 创建或更新球员时的提交参数。
 *
 * @property openid 微信 openid。
 * @property playerNumber 球员号码。
 * @property nickname 昵称。
 * @property realName 真实姓名。
 * @property avatarUrl 头像 URL。
 * @property subTeam 子球队，多个值用逗号分隔。
 * @property jerseyName 球衣名称。
 * @property birthDate 出生日期，接口传输时使用 ISO 字符串。
 * @property isAdmin 是否为球队管理员。
 * @property position 足球位置。
 * @property jerseySize 球衣尺码。
 * @property status 球员状态。
 * @property remark 备注。
 */
export interface PlayerPayload {
  openid?: string
  playerNumber: number
  nickname: string
  realName?: string
  avatarUrl?: string
  subTeam?: string
  jerseyName?: string
  birthDate?: DateTimeString
  isAdmin?: boolean
  position?: string
  jerseySize?: string
  status?: PlayerStatus
  remark?: string
}

export interface PlayerListParams {
  page?: number
  pageSize?: number
  keyword?: string
  subTeam?: string
}

export interface PlayerListResponse {
  list: Player[]
  total: number
}
