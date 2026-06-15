import type { SearchField } from '@/components/common/EsSearch/types'

import {
  ASSET_RECORD_ALL_TYPE_OPTIONS,
  ASSET_RECORD_DIRECTION_OPTIONS,
  ASSET_RECORD_STATUS_OPTIONS,
} from '../model/defaults'

export function createAssetRecordSearchFields(): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '标题 / 备注',
    },
    {
      key: 'direction',
      label: '方向',
      type: 'select',
      placeholder: '全部',
      options: ASSET_RECORD_DIRECTION_OPTIONS,
      props: {
        clearable: true,
      },
    },
    {
      key: 'recordType',
      label: '类型',
      type: 'select',
      placeholder: '全部',
      options: ASSET_RECORD_ALL_TYPE_OPTIONS,
      props: {
        clearable: true,
      },
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: ASSET_RECORD_STATUS_OPTIONS,
      props: {
        clearable: true,
      },
    },
    {
      key: 'dateRange',
      label: '日期范围',
      type: 'dateRange',
    },
  ]
}
