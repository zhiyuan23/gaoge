import type { DateTimeString } from './common.js'

export type MessageBoardPostStatus = 'draft' | 'published'

export interface MessageBoardTagOption {
  label: string
  value: string
}

export interface MessageBoardPost {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  status: MessageBoardPostStatus
  isPinned: boolean
  publishedAt: DateTimeString | null
  createdAt: DateTimeString
  updatedAt: DateTimeString
}

export interface MessageBoardPostPayload {
  title: string
  content: string
  tags?: string[]
  sourceName: string
  sourceUrl?: string
  status?: MessageBoardPostStatus
  isPinned?: boolean
}

export interface MessageBoardPostListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: MessageBoardPostStatus | ''
  tag?: string
}

export interface MessageBoardPostListResponse {
  list: MessageBoardPost[]
  total: number
  tagOptions: MessageBoardTagOption[]
}

export interface MiniappMessageBoardPostItem {
  id: number
  title: string
  content: string
  tags: string[]
  sourceName: string
  sourceUrl: string | null
  isPinned: boolean
  publishedAt: DateTimeString | null
}

export interface MiniappMessageBoardListParams {
  page?: number
  pageSize?: number
  tag?: string
}

export interface MiniappMessageBoardListResponse {
  list: MiniappMessageBoardPostItem[]
  total: number
  tagOptions: MessageBoardTagOption[]
}
