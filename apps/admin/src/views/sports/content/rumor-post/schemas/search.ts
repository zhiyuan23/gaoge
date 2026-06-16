import type { SearchField, SearchOption } from '@/components/common/EsSearch/types'

import { RUMOR_POST_STATUS_OPTIONS } from '../model/defaults'

export interface RumorPostSearchFieldContext {
  tagOptions: () => SearchOption[]
}

export function createRumorPostSearchFields(ctx: RumorPostSearchFieldContext): SearchField[] {
  return [
    {
      key: 'keyword',
      label: '关键词',
      type: 'input',
      placeholder: '标题 / 正文 / 来源',
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      placeholder: '全部',
      options: RUMOR_POST_STATUS_OPTIONS,
      props: {
        clearable: true,
      },
    },
    {
      key: 'tag',
      label: '标签',
      type: 'select',
      placeholder: '全部',
      options: ctx.tagOptions,
      props: {
        clearable: true,
        filterable: true,
      },
    },
  ]
}
