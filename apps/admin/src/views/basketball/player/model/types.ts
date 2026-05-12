import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface PlayerSearch extends SearchFormData {
  keyword: string
  subTeam: string
}

export interface PlayerFormModel {
  id?: number
  openid: string
  playerNumber: number | null
  nickname: string
  realName: string
  avatarUrl: string
  subTeam: string
  jerseyName: string
  birthDate: string
  isAdmin: boolean
  position: string
  jerseySize: string
  status: string
  remark: string
}
