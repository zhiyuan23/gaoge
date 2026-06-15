import type { BannerJumpType, BannerStatus } from '@gaoge/shared-types'

import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface BannerSearch extends SearchFormData {
  keyword: string
  status: string
  jumpType: string
}

export interface BannerFormModel {
  title: string
  imageUrl: string
  jumpType: BannerJumpType
  jumpUrl: string
  sort: number
  status: BannerStatus
}
