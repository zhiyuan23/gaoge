import type {
  AssetRecord,
  AssetRecordDirection,
  AssetRecordListParams,
  AssetRecordListResponse,
  AssetRecordPayload,
  AssetRecordStatus,
  AssetRecordSummary,
  AssetRecordType,
} from '@gaoge/shared-types'

import api from '@/api'

export type {
  AssetRecord,
  AssetRecordDirection,
  AssetRecordListParams,
  AssetRecordListResponse,
  AssetRecordPayload,
  AssetRecordStatus,
  AssetRecordSummary,
  AssetRecordType,
}

export default {
  list: (params?: AssetRecordListParams) =>
    api.get<AssetRecordListResponse>('/football/asset-records', { params }),
  summary: () => api.get<AssetRecordSummary>('/football/asset-records/summary'),
  create: (data: AssetRecordPayload) => api.post<AssetRecord>('/football/asset-records', data),
  update: (id: number, data: AssetRecordPayload) =>
    api.patch<AssetRecord>(`/football/asset-records/${id}`, data),
  remove: (id: number) => api.delete<AssetRecord>(`/football/asset-records/${id}`),
}
