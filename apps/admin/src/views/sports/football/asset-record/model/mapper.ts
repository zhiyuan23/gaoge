import dayjs from 'dayjs'

import type {
  AssetRecord,
  AssetRecordListParams,
  AssetRecordPayload,
} from '@/api/football/asset-record'

import type { AssetRecordFormModel, AssetRecordSearch } from './types'

export function createAssetRecordFormFromRow(row: AssetRecord): AssetRecordFormModel {
  return {
    id: row.id,
    direction: row.direction,
    recordType: row.recordType,
    amount: row.amount / 100,
    matchLabel: row.matchLabel ?? row.seasonLabel ?? '',
    isWaived: row.isWaived,
    title: row.title,
    description: row.description ?? '',
    recordDate: dayjs(row.recordDate).format('YYYY-MM-DD'),
    status: row.status,
  }
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

export function buildAssetRecordPayload(model: AssetRecordFormModel): AssetRecordPayload {
  return {
    direction: model.direction,
    recordType: model.recordType,
    amount: model.isWaived ? 0 : Math.round(Number(model.amount ?? 0) * 100),
    matchLabel: normalizeOptionalText(model.matchLabel),
    isWaived: model.isWaived,
    title: model.title.trim(),
    description: normalizeOptionalText(model.description),
    recordDate: model.recordDate,
    status: model.status,
  }
}

export function buildAssetRecordListParams(
  search: AssetRecordSearch,
  page: number,
  pageSize: number,
): AssetRecordListParams {
  const [startDate, endDate] = search.dateRange || []

  return {
    page,
    pageSize,
    keyword: search.keyword.trim() || undefined,
    direction: search.direction || undefined,
    recordType: search.recordType || undefined,
    status: search.status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }
}
