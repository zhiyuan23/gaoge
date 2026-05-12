import { PATH_METADATA } from '@nestjs/common/constants'

import { ROLES_KEY } from '@/common/auth/roles.decorator'

import { FundController } from './basketball/fund/fund.controller'
import { MatchRoundController } from './basketball/match-round/match-round.controller'
import { PlayerController } from './basketball/player/player.controller'
import { TeamController } from './basketball/team/team.controller'

describe('basketball route metadata', () => {
  it('maps players routes under /basketball/players', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PlayerController)).toBe('basketball/players')
  })

  it('maps teams routes under /basketball/teams', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TeamController)).toBe('basketball/teams')
  })

  it('maps match rounds routes under /basketball/match-rounds', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MatchRoundController)).toBe('basketball/match-rounds')
  })

  it('maps fund routes under /basketball/fund', () => {
    expect(Reflect.getMetadata(PATH_METADATA, FundController)).toBe('basketball/fund')
  })

  it('requires admin role for fund writes', () => {
    expect(Reflect.getMetadata(ROLES_KEY, FundController.prototype.create)).toEqual(['admin'])
    expect(Reflect.getMetadata(ROLES_KEY, FundController.prototype.update)).toEqual(['admin'])
    expect(Reflect.getMetadata(ROLES_KEY, FundController.prototype.remove)).toEqual(['admin'])
  })
})
