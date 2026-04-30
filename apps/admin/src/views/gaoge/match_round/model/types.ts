import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface MatchRoundSearch extends SearchFormData {
  matchDate: string
  venueKeyword: string
}

export interface MatchRoundResultFormItem {
  teamId: number
  teamName: string
  rank: 1 | 2 | 3 | null
  points: 0 | 1 | 2 | null
}

export interface MatchRoundFormModel {
  id?: number
  matchDate: string
  venue: string
  remark: string
  results: MatchRoundResultFormItem[]
}
