import type { RumorPost, RumorPostListParams, RumorPostPayload } from '@/api/content/rumor-post'

import type { RumorPostFormModel, RumorPostSearch } from './types'

export function createRumorPostFormFromRow(row: RumorPost): RumorPostFormModel {
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

export function buildRumorPostPayload(model: RumorPostFormModel): RumorPostPayload {
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

export function buildRumorPostListParams(
  search: RumorPostSearch,
  page: number,
  pageSize: number,
): RumorPostListParams {
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
