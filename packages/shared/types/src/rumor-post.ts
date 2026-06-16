import type { DateTimeString } from './common.js'

export type RumorPostStatus = 'draft' | 'published'

export interface RumorTagOption {
  label: string
  value: string
}

export interface RumorPost {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  status: RumorPostStatus
  isPinned: boolean
  publishedAt: DateTimeString | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface RumorPostPayload {
  title: string
  content: string
  tags?: string[]
  sourceName: string
  sourceUrl?: string
  status?: RumorPostStatus
  isPinned?: boolean
}

export interface RumorPostListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: RumorPostStatus | ''
  tag?: string
}

export interface RumorPostListResponse {
  list: RumorPost[]
  total: number
  tagOptions: RumorTagOption[]
}

export interface MiniappRumorPostItem {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  isPinned: boolean
  publishedAt: DateTimeString | null
}

export interface MiniappRumorPostListParams {
  page?: number
  pageSize?: number
  tag?: string
}

export interface MiniappRumorPostListResponse {
  list: MiniappRumorPostItem[]
  total: number
  tagOptions: RumorTagOption[]
}
