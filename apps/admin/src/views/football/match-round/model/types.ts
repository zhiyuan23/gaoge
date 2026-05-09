import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface MatchRoundSearch extends SearchFormData {
  year: number | ''
  season: '春季赛' | '夏季赛' | '秋季赛' | '冬季赛' | ''
  round: number | ''
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
  year: number | null
  season: '春季赛' | '夏季赛' | '秋季赛' | '冬季赛' | ''
  round: number | null
  matchDate: string
  venue: string
  remark: string
  results: MatchRoundResultFormItem[]
}
