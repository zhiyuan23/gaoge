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
