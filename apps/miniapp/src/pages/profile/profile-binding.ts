import type { MiniappBindOption, MiniappMeResponse } from '@gaoge/shared-types'

export type ProfileViewState = 'loading' | 'bound' | 'unbound'

export const resolveProfileViewState = (
  me: Pick<MiniappMeResponse, 'user' | 'player'> | null,
): ProfileViewState => {
  if (!me) {
    return 'loading'
  }

  return me.user.isBound && me.player ? 'bound' : 'unbound'
}

export const formatBindOptionLabel = (option: MiniappBindOption) => {
  const numberLabel = option.playerNumber ?? '-'
  const teamSuffix = option.subTeam ? ` · ${option.subTeam}` : ''

  return `#${numberLabel} ${option.nickname}${teamSuffix}`
}

export const shouldDisableBindConfirm = (
  selectedPlayerNumber: number | null,
  submitting: boolean,
) => selectedPlayerNumber === null || submitting
