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
    api.get<AssetRecordListResponse>('/basketball/asset-records', { params }),
  summary: () => api.get<AssetRecordSummary>('/basketball/asset-records/summary'),
  create: (data: AssetRecordPayload) => api.post<AssetRecord>('/basketball/asset-records', data),
  update: (id: number, data: AssetRecordPayload) =>
    api.patch<AssetRecord>(`/basketball/asset-records/${id}`, data),
  remove: (id: number) => api.delete<AssetRecord>(`/basketball/asset-records/${id}`),
}
