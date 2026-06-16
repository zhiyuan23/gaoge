import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface RumorPostSearch extends SearchFormData {
  keyword: string
  status: string
  tag: string
}

export interface RumorPostFormModel {
  id?: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string
  status: 'draft' | 'published'
  isPinned: boolean
}
