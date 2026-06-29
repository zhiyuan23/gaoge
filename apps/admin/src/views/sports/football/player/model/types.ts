import type { FootballPosition } from '@gaoge/shared-types'

import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface PlayerSearch extends SearchFormData {
  keyword: string
  teamId: number | ''
  position: FootballPosition | ''
}

export interface PlayerFormModel {
  id?: number
  openid: string
  playerNumber: number | null
  nickname: string
  realName: string
  avatarUrl: string
  subTeam: string
  teamIds: number[]
  primaryTeamId: number | ''
  jerseyName: string
  birthDate: string
  isAdmin: boolean
  position: string
  positions: FootballPosition[]
  primaryPosition: FootballPosition | ''
  jerseySize: string
  status: string
  signature: string
  remark: string
}
