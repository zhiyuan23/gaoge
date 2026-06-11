import type {
  MessageBoardPost,
  MessageBoardPostListParams,
  MessageBoardPostPayload,
} from '@/api/content/message-board-post'

import type { MessageBoardPostFormModel, MessageBoardPostSearch } from './types'

export function createMessageBoardPostFormFromRow(
  row: MessageBoardPost,
): MessageBoardPostFormModel {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl ?? '',
    status: row.status,
    isPinned: row.isPinned,
  }
}

export function buildMessageBoardPostPayload(
  model: MessageBoardPostFormModel,
): MessageBoardPostPayload {
  return {
    title: model.title.trim(),
    content: model.content.trim(),
    tags: Array.from(new Set(model.tags.map((tag) => tag.trim()).filter(Boolean))),
    sourceName: model.sourceName.trim(),
    sourceUrl: model.sourceUrl.trim(),
    status: model.status,
    isPinned: model.isPinned,
  }
}

export function buildMessageBoardPostListParams(
  search: MessageBoardPostSearch,
  page: number,
  pageSize: number,
): MessageBoardPostListParams {
  const status =
    search.status === 'draft' || search.status === 'published' ? search.status : undefined

  return {
    page,
    pageSize,
    keyword: search.keyword || undefined,
    status,
    tag: search.tag || undefined,
  }
}
