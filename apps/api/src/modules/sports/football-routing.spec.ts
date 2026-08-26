import { PATH_METADATA } from '@nestjs/common/constants'

import { PERMISSIONS_KEY } from '@/common/auth/permissions.decorator'
import { AuthController } from '@/modules/auth/auth.controller'

import { FundController } from './football/fund/fund.controller'
import { MatchRoundController } from './football/match-round/match-round.controller'
import { PlayerController } from './football/player/player.controller'
import { StandingController } from './football/standing/standing.controller'
import { TeamController } from './football/team/team.controller'

describe('football route metadata', () => {
  it('maps players routes under /football/players', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PlayerController)).toBe('football/players')
  })

  it('maps teams routes under /football/teams', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TeamController)).toBe('football/teams')
  })

  it('maps match rounds routes under /football/match-rounds', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MatchRoundController)).toBe('football/match-rounds')
  })

  it('maps standings routes under /football/standings', () => {
    expect(Reflect.getMetadata(PATH_METADATA, StandingController)).toBe('football/standings')
  })

  it('maps fund routes under /football/fund', () => {
    expect(Reflect.getMetadata(PATH_METADATA, FundController)).toBe('football/fund')
  })

  it('requires exact resource permissions for fund writes', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, FundController.prototype.create)).toEqual([
      'football.fund.create',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, FundController.prototype.update)).toEqual([
      'football.fund.update',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, FundController.prototype.remove)).toEqual([
      'football.fund.delete',
    ])
  })

  it('keeps profile and permission under /auth', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthController)).toBe('auth')
  })
})
