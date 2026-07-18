import type { AssetRecordDirection, AssetRecordType } from '@gaoge/shared-types'

export type AssetFilterKey = 'all' | 'income' | 'expense'

export const ASSET_FILTER_OPTIONS: Array<{ key: AssetFilterKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'income', label: '收入' },
  { key: 'expense', label: '支出' },
]

export const formatAssetCurrency = (amount: number) =>
  `¥${(amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export const formatAssetSignedAmount = (direction: AssetRecordDirection, amount: number) =>
  `${direction === 'income' ? '+' : '-'}${formatAssetCurrency(amount)}`

export const formatAssetRecordDate = (value: string | null | undefined) =>
  value ? String(value).slice(0, 10) : '-'

export const getAssetDirectionByFilter = (
  filterKey: AssetFilterKey,
): AssetRecordDirection | undefined => {
  return filterKey === 'all' ? undefined : filterKey
}

export const getAssetRecordTypeLabel = (recordType: AssetRecordType) => {
  const labels: Record<AssetRecordType, string> = {
    match_fee: '比赛收费',
    extra_income: '额外收入',
    equipment: '球队装备',
    activity: '活动支出',
    other_expense: '其他支出',
  }

  return labels[recordType] || recordType
}

export const getAssetTotalPage = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / pageSize))
