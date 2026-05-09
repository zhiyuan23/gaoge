import type {
  AssetRecordDirection,
  AssetRecordStatus,
  AssetRecordSummary,
  AssetRecordType,
} from '@/api/football/asset-record'
import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface AssetRecordSearch extends SearchFormData {
  keyword: string
  direction: AssetRecordDirection | ''
  recordType: AssetRecordType | ''
  seasonLabel: string
  status: AssetRecordStatus | ''
  dateRange: string[]
}

export interface AssetRecordFormModel {
  id?: number
  direction: AssetRecordDirection
  recordType: AssetRecordType
  amount: number | null
  seasonLabel: string
  matchLabel: string
  isWaived: boolean
  title: string
  description: string
  recordDate: string
  status: AssetRecordStatus
}

export type AssetRecordSummaryModel = AssetRecordSummary
