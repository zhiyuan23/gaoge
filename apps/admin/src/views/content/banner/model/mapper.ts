import type { Banner , BannerListParams } from '@/api/content/banner'
import type { ListPageRequestResult } from '@/composables/useListPage'

import type { BannerSearch } from './types'

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
