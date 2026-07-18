import type {
  AssetRecordListParams,
  AssetRecordListResponse,
  AssetRecordSummary,
} from '@gaoge/shared-types'

import { get } from '@/api/request'

export const requestFootballAssetSummary = () =>
  get<AssetRecordSummary>('/football/asset-records/summary')

export const requestFootballAssetRecords = (params?: AssetRecordListParams) =>
  get<AssetRecordListResponse>('/football/asset-records', params)
