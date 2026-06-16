import type { Banner, BannerListParams, BannerPayload } from '@/api/content/banner'
import type { ListPageRequestResult } from '@/composables/useListPage'

import type { BannerFormModel, BannerSearch } from './types'

export function buildBannerListParams(
  search: BannerSearch,
  _page: number,
  _pageSize: number,
): BannerListParams {
  const status =
    search.status === 'active' || search.status === 'inactive' ? search.status : undefined
  const jumpType =
    search.jumpType === 'none' || search.jumpType === 'webview' || search.jumpType === 'miniapp'
      ? search.jumpType
      : undefined

  return {
    keyword: search.keyword || undefined,
    status,
    jumpType,
  }
}

export function normalizeBannerListResponse(banners: Banner[]): ListPageRequestResult<Banner> {
  return {
    list: banners,
    total: banners.length,
  }
}

export function createBannerFormFromRow(row: Banner): BannerFormModel {
  return {
    title: row.title,
    subtitle: row.subtitle ?? '',
    imageUrl: row.imageUrl,
    jumpType: row.jumpType,
    jumpUrl: row.jumpUrl ?? '',
    sort: row.sort,
    status: row.status,
  }
}

export function buildBannerPayload(model: BannerFormModel): BannerPayload {
  const jumpUrl = model.jumpType === 'none' ? undefined : model.jumpUrl.trim()

  return {
    title: model.title.trim(),
    subtitle: model.subtitle.trim() || undefined,
    imageUrl: model.imageUrl.trim(),
    jumpType: model.jumpType,
    jumpUrl,
    sort: model.sort,
    status: model.status,
  }
}
