import type { PlayerFormModel, PlayerSearch } from './types'

export const PLAYER_DEFAULT_SEARCH: PlayerSearch = {
  keyword: '',
  teamId: '',
  position: '',
}

export function createEmptyPlayerForm(): PlayerFormModel {
  return {
    openid: '',
    playerNumber: null,
    nickname: '',
    realName: '',
    avatarUrl: '',
    subTeam: '',
    teamIds: [],
    primaryTeamId: '',
    jerseyName: '',
    birthDate: '',
    isAdmin: false,
    position: '',
    positions: [],
    primaryPosition: '',
    jerseySize: '',
    status: 'active',
    superheroName: '',
    signature: '',
    remark: '',
  }
}
