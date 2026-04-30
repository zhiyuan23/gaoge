import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface TeamSearch extends SearchFormData {
  keyword: string
}

export interface TeamFormModel {
  id?: number
  name: string
  slogan: string
  sponsorName: string
  sort: number | null
}
