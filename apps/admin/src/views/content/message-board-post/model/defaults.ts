import type { SearchOption } from '@/components/common/EsSearch/types'

import type { MessageBoardPostFormModel, MessageBoardPostSearch } from './types'

export const MESSAGE_BOARD_POST_DEFAULT_SEARCH: MessageBoardPostSearch = {
  keyword: '',
  status: '',
  tag: '',
}

export const MESSAGE_BOARD_POST_STATUS_OPTIONS: SearchOption[] = [
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
]

export function createEmptyMessageBoardPostForm(): MessageBoardPostFormModel {
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
