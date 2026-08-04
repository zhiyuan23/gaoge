import type { DateTimeString } from './common.js'
import type { Team } from './team.js'

/** 球员状态。当前允许历史或自定义状态值，因此暂时保持 string。 */
export type PlayerStatus = string

/** 足球位置字典。 */
export type FootballPosition =
  | 'goalkeeper'
  | 'center_back'
  | 'left_back'
  | 'right_back'
  | 'defensive_midfielder'
  | 'central_midfielder'
  | 'attacking_midfielder'
  | 'left_winger'
  | 'right_winger'
  | 'striker'
  | 'forward'

/** 足球位置选项。 */
export const FOOTBALL_POSITION_OPTIONS: Array<{
  label: string
  value: FootballPosition
}> = [
  { label: '门将', value: 'goalkeeper' },
  { label: '中后卫', value: 'center_back' },
  { label: '左后卫', value: 'left_back' },
  { label: '右后卫', value: 'right_back' },
  { label: '后腰', value: 'defensive_midfielder' },
  { label: '中前卫', value: 'central_midfielder' },
  { label: '前腰', value: 'attacking_midfielder' },
  { label: '左边锋', value: 'left_winger' },
  { label: '右边锋', value: 'right_winger' },
  { label: '中锋', value: 'striker' },
  { label: '前锋', value: 'forward' },
]

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
 * @property teamIds 代表球队 ID 列表。
 * @property teams 代表球队列表。
 * @property primaryTeamId 主队 ID，未设置时为 null。
 * @property primaryTeam 主队，未设置时为 null。
 * @property jerseyName 球衣名称。
 * @property birthDate 出生日期，接口传输时使用 ISO 字符串。
 * @property isAdmin 是否为球队管理员。
 * @property position 足球位置。
 * @property positions 可踢位置列表。
 * @property primaryPosition 主位置，未设置时为 null。
 * @property jerseySize 球衣尺码。
 * @property status 球员状态。
 * @property signature 签名或简介。
 * @property superheroName 对应的漫威或 DC 超级英雄名称。
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
  teamIds: number[]
  teams: Team[]
  primaryTeamId: number | null
  primaryTeam: Team | null
  jerseyName: string | null
  birthDate: DateTimeString | null
  isAdmin: boolean
  position: string | null
  positions: FootballPosition[]
  primaryPosition: FootballPosition | null
  jerseySize: string | null
  status: PlayerStatus
  signature: string | null
  superheroName: string | null
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
 * @property teamIds 代表球队 ID 列表。
 * @property primaryTeamId 主队 ID，传 null 表示无主队。
 * @property jerseyName 球衣名称。
 * @property birthDate 出生日期，接口传输时使用 ISO 字符串。
 * @property isAdmin 是否为球队管理员。
 * @property position 足球位置。
 * @property positions 可踢位置列表。
 * @property primaryPosition 主位置，传 null 表示无主位置。
 * @property jerseySize 球衣尺码。
 * @property status 球员状态。
 * @property signature 签名或简介。
 * @property superheroName 对应的漫威或 DC 超级英雄名称。
 * @property remark 备注。
 */
export interface PlayerPayload {
  openid?: string
  playerNumber: number
  nickname: string
  realName?: string
  avatarUrl?: string
  subTeam?: string
  teamIds?: number[]
  primaryTeamId?: number | null
  jerseyName?: string
  birthDate?: DateTimeString
  isAdmin?: boolean
  position?: string
  positions?: FootballPosition[]
  primaryPosition?: FootballPosition | null
  jerseySize?: string
  status?: PlayerStatus
  signature?: string
  superheroName?: string | null
  remark?: string
}

export interface PlayerListParams {
  page?: number
  pageSize?: number
  keyword?: string
  subTeam?: string
  teamId?: number | string
  primaryTeamId?: number | string | 'none'
  position?: FootballPosition
  primaryPosition?: FootballPosition
}

export interface PlayerListResponse {
  list: Player[]
  total: number
}
