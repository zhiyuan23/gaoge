import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface PlayerSearch extends SearchFormData {
  keyword: string
  subTeam: string
  position: string
  status: string
}

export interface PlayerFormModel {
  id?: number
  openid: string
  nickname: string
  realName: string
  avatarUrl: string
  subTeam: string
  birthDate: string
  isAdmin: boolean
  position: string
  jerseySize: string
  status: string
  remark: string
}
