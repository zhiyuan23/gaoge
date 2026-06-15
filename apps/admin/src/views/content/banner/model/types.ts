import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface BannerSearch extends SearchFormData {
  keyword: string
  status: string
  jumpType: string
}
