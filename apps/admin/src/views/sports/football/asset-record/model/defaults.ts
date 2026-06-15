import type { AssetRecordDirection, AssetRecordType } from '@/api/football/asset-record'
import type { SearchOption } from '@/components/common/EsSearch/types'

import type { AssetRecordFormModel, AssetRecordSearch } from './types'

export const ASSET_RECORD_DEFAULT_SEARCH: AssetRecordSearch = {
  keyword: '',
  direction: '',
  recordType: '',
  status: '',
  dateRange: [],
}

export const ASSET_RECORD_DIRECTION_OPTIONS: SearchOption[] = [
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
]

export const ASSET_RECORD_STATUS_OPTIONS: SearchOption[] = [
  { label: '已确认', value: 'confirmed' },
  { label: '已取消', value: 'cancelled' },
]

export const ASSET_RECORD_ALL_TYPE_OPTIONS: SearchOption[] = [
  { label: '比赛收费', value: 'match_fee' },
  { label: '额外收入', value: 'extra_income' },
  { label: '球队装备', value: 'equipment' },
  { label: '活动支出', value: 'activity' },
  { label: '其他支出', value: 'other_expense' },
]

export const ASSET_RECORD_INCOME_TYPE_OPTIONS: SearchOption[] = [
  { label: '比赛收费', value: 'match_fee' },
  { label: '额外收入', value: 'extra_income' },
]

export const ASSET_RECORD_EXPENSE_TYPE_OPTIONS: SearchOption[] = [
  { label: '球队装备', value: 'equipment' },
  { label: '活动支出', value: 'activity' },
  { label: '其他支出', value: 'other_expense' },
]

export function getDefaultRecordType(direction: AssetRecordDirection): AssetRecordType {
  return direction === 'income' ? 'match_fee' : 'equipment'
}

export function getAssetRecordTypeOptions(direction: AssetRecordDirection): SearchOption[] {
  return direction === 'income'
    ? ASSET_RECORD_INCOME_TYPE_OPTIONS
    : ASSET_RECORD_EXPENSE_TYPE_OPTIONS
}

export function createEmptyAssetRecordForm(
  direction: AssetRecordDirection = 'income',
): AssetRecordFormModel {
  return {
    direction,
    recordType: getDefaultRecordType(direction),
    amount: direction === 'income' ? 20 : null,
    matchLabel: '',
    isWaived: false,
    title: '',
    description: '',
    recordDate: '',
    status: 'confirmed',
  }
}

export function createEmptyAssetRecordSummary() {
  return {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    waivedMatchCount: 0,
  }
}
