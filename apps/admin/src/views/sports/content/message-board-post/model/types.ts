import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface MessageBoardPostSearch extends SearchFormData {
  keyword: string
  status: string
  tag: string
}

export interface MessageBoardPostFormModel {
  id?: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string
  status: 'draft' | 'published'
  isPinned: boolean
}
