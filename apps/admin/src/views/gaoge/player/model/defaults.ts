import type { PlayerFormModel, PlayerSearch } from './types'

export const PLAYER_DEFAULT_SEARCH: PlayerSearch = {
  keyword: '',
  subTeam: '',
  position: '',
  status: '',
}

export function createEmptyPlayerForm(): PlayerFormModel {
  return {
    openid: '',
    nickname: '',
    realName: '',
    avatarUrl: '',
    subTeam: '',
    birthDate: '',
    isAdmin: false,
    position: '',
    jerseySize: '',
    status: 'active',
    remark: '',
  }
}
