import type { DateTimeString } from './common.js'

/** 球队资金记录类型。 */
export type TeamFundType = 'income' | 'expense'

/** 球队资金记录状态。只有 confirmed 记录参与正式汇总。 */
export type TeamFundStatus = 'pending' | 'confirmed' | 'cancelled'

/** 球队资金分类。 */
export type TeamFundCategory = 'game_fee' | 'equipment' | 'venue' | 'activity' | 'sponsor' | 'other'

/**
 * 球队资金明细。金额统一以分为单位存储和传输。
 *
 * @property id 资金记录 ID。
 * @property type 收入或支出。
 * @property amount 金额，单位为分。
 * @property title 记录标题。
 * @property description 详细说明。
 * @property category 资金分类。
 * @property status 记录状态。
 * @property recordDate 业务发生日期。
 * @property creatorId 创建者用户 ID。
 * @property createdAt 创建时间。
 * @property updatedAt 更新时间。
 */
export interface TeamFund {
  id: number
  type: TeamFundType
  amount: number
  title: string
  description: string | null
  category: TeamFundCategory
  status: TeamFundStatus
  recordDate: DateTimeString
  creatorId: number | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

/**
 * 球队资金汇总。金额统一以分为单位。
 *
 * @property totalIncome 已确认收入总额，单位为分。
 * @property totalExpense 已确认支出总额，单位为分。
 * @property balance 余额，单位为分。
 */
export interface TeamFundSummary {
  totalIncome: number
  totalExpense: number
  balance: number
}

/**
 * 创建球队资金明细时的提交参数。
 *
 * @property type 收入或支出。
 * @property amount 金额，单位为分。
 * @property title 记录标题。
 * @property description 详细说明。
 * @property category 资金分类。
 * @property status 记录状态，未提供时由后端使用默认状态。
 * @property recordDate 业务发生日期。
 */
export interface TeamFundPayload {
  type: TeamFundType
  amount: number
  title: string
  description?: string
  category: TeamFundCategory
  status?: TeamFundStatus
  recordDate: DateTimeString
}

/** 更新球队资金明细时的提交参数。 */
export type UpdateTeamFundPayload = Partial<TeamFundPayload>

/**
 * 球队信息。
 *
 * @property id 球队 ID。
 * @property code 球队编码，仅由后端生成；后台只读且不展示、不编辑。
 * @property name 球队名称。
 * @property slogan 球队口号。
 * @property sponsorName 赞助商名称。
 * @property sort 排序值，数值越小越靠前。
 * @property createdAt 创建时间。
 * @property updatedAt 更新时间。
 */
export interface Team {
  id: number
  code: string
  name: string
  slogan: string | null
  sponsorName: string | null
  sort: number
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

/**
 * 创建或更新球队时的提交参数。
 *
 * @property name 球队名称。
 * @property slogan 球队口号；传 null 表示显式清空。
 * @property sponsorName 赞助商名称；传 null 表示显式清空。
 * @property sort 排序值。
 */
export interface TeamPayload {
  name: string
  slogan?: string | null
  sponsorName?: string | null
  sort: number
}

/** 球队列表查询参数。 */
export interface TeamListParams {
  keyword?: string
  page?: number | string
  pageSize?: number | string
}

/** 球队列表响应。 */
export interface TeamListResponse {
  list: Team[]
  total: number
}

/**
 * 单场比赛的球队结果信息。
 *
 * @property teamId 球队 ID。
 * @property rank 名次，仅允许 1/2/3。
 * @property points 积分。
 * @property teamName 球队名称，列表展示时可由后端附带。
 */
export interface MatchRoundResultItem {
  teamId: number
  rank: 1 | 2 | 3
  points: 0 | 1 | 2
  teamName?: string
}

/** 比赛轮次里固定一支球队的提交项。 */
export interface MatchRoundResultPayloadItem {
  teamId: number
  rank: 1 | 2 | 3
}

/**
 * 比赛轮次信息。
 *
 * @property id 比赛轮次 ID。
 * @property matchDate 比赛日期时间。
 * @property venue 比赛场地。
 * @property remark 备注。
 * @property results 本轮比赛固定 3 支球队的结果列表。
 * @property createdAt 创建时间。
 * @property updatedAt 更新时间。
 */
export interface MatchRound {
  id: number
  matchDate: DateTimeString
  venue: string | null
  remark: string | null
  results: [MatchRoundResultItem, MatchRoundResultItem, MatchRoundResultItem]
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

/**
 * 创建或更新比赛轮次时的提交参数。
 *
 * @property matchDate 比赛日期，格式 YYYY-MM-DD。
 * @property venue 比赛场地；传 null 表示显式清空。
 * @property remark 备注；传 null 表示显式清空。
 * @property results 本轮比赛固定 3 支球队的名次提交列表，积分由后端按名次推导。
 */
export interface MatchRoundPayload {
  matchDate: string
  venue?: string | null
  remark?: string | null
  results: [MatchRoundResultPayloadItem, MatchRoundResultPayloadItem, MatchRoundResultPayloadItem]
}

/** 更新比赛轮次时的提交参数。 */
export interface UpdateMatchRoundPayload {
  matchDate?: string
  venue?: string | null
  remark?: string | null
  results?:
    | [MatchRoundResultPayloadItem, MatchRoundResultPayloadItem, MatchRoundResultPayloadItem]
    | undefined
}

/** 比赛轮次列表查询参数。 */
export interface MatchRoundListParams {
  page?: number | string
  pageSize?: number | string
  matchDate?: string
  venueKeyword?: string
}

/** 比赛轮次列表响应。 */
export interface MatchRoundListResponse {
  list: MatchRound[]
  total: number
}
