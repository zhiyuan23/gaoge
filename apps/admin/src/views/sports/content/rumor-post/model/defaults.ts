import type { SearchOption } from '@/components/common/EsSearch/types'

import type { RumorPostFormModel, RumorPostSearch } from './types'

export const RUMOR_POST_DEFAULT_SEARCH: RumorPostSearch = {
  keyword: '',
  status: '',
  tag: '',
}

export const RUMOR_POST_STATUS_OPTIONS: SearchOption[] = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
]

export function createEmptyRumorPostForm(): RumorPostFormModel {
  return {
    title: '',
    content: '',
    tags: [],
    sourceName: '',
    sourceUrl: '',
    status: 'draft',
    isPinned: false,
  }
}
