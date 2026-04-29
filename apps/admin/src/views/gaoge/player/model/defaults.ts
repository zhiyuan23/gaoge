import type { PlayerFormModel, PlayerSearch } from './types'

export const PLAYER_DEFAULT_SEARCH: PlayerSearch = {
  keyword: '',
  subTeam: '',
}

export function createEmptyPlayerForm(): PlayerFormModel {
  return {
    openid: '',
    playerNumber: null,
    nickname: '',
    realName: '',
    avatarUrl: '',
    subTeam: '',
    jerseyName: '',
    birthDate: '',
    isAdmin: false,
    position: '',
    jerseySize: '',
    status: 'active',
    remark: '',
  }
}
