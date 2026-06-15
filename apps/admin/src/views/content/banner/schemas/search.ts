import type { SearchField } from '@/components/common/EsSearch/types'

import { BANNER_JUMP_TYPE_OPTIONS, BANNER_STATUS_OPTIONS } from './form'

export function createBannerSearchFields(): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '标题 / 跳转链接',
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: BANNER_STATUS_OPTIONS,
      props: {
        clearable: true,
      },
    },
    {
      key: 'jumpType',
      label: '跳转类型',
      type: 'select',
      placeholder: '全部',
      options: BANNER_JUMP_TYPE_OPTIONS,
      props: {
        clearable: true,
      },
    },
  ]
}
