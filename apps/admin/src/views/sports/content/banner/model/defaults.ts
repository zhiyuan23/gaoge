import type { BannerFormModel, BannerSearch } from './types'

export const BANNER_DEFAULT_SEARCH: BannerSearch = {
  keyword: '',
  status: '',
  jumpType: '',
}

export function createEmptyBannerForm(): BannerFormModel {
  return {
    title: '',
    subtitle: '',
    imageUrl: '',
    jumpType: 'none',
    jumpUrl: '',
    sort: 0,
    status: 'active',
  }
}
