import type { DateTimeString } from './common.js'

export type AssetRecordDirection = 'income' | 'expense'

export type AssetRecordType =
  | 'match_fee'
  | 'extra_income'
  | 'equipment'
  | 'activity'
  | 'other_expense'

export type AssetRecordStatus = 'confirmed' | 'cancelled'

export interface AssetRecord {
  id: number
  direction: AssetRecordDirection
  recordType: AssetRecordType
  amount: number
  seasonLabel: string | null
  matchLabel: string | null
  isWaived: boolean
  title: string
  description: string | null
  recordDate: DateTimeString
  status: AssetRecordStatus
  creatorId: number | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface AssetRecordPayload {
  direction: AssetRecordDirection
  recordType: AssetRecordType
  amount: number
  seasonLabel?: string | null
  matchLabel?: string | null
  isWaived?: boolean
  title: string
  description?: string | null
  recordDate: DateTimeString
  status?: AssetRecordStatus
}

export interface AssetRecordListParams {
  page?: number | string
  pageSize?: number | string
  keyword?: string
  direction?: AssetRecordDirection
  recordType?: AssetRecordType
  seasonLabel?: string
  status?: AssetRecordStatus
  startDate?: string
  endDate?: string
}

export interface AssetRecordListResponse {
  list: AssetRecord[]
  total: number
}

export interface AssetRecordSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  waivedMatchCount: number
}
