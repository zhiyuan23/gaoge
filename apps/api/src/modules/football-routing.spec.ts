import { PATH_METADATA } from '@nestjs/common/constants'

import { ROLES_KEY } from '@/common/auth/roles.decorator'

import { AuthController } from './auth/controllers/auth.controller'
import { FundController } from './football/fund/fund.controller'
import { MatchRoundsController } from './football/match-rounds/match-rounds.controller'
import { PlayersController } from './football/players/players.controller'
import { TeamsController } from './football/teams/teams.controller'

describe('football route metadata', () => {
  it('maps players routes under /football/players', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PlayersController)).toBe('football/players')
  })

  it('maps teams routes under /football/teams', () => {
    expect(Reflect.getMetadata(PATH_METADATA, TeamsController)).toBe('football/teams')
  })

  it('maps match rounds routes under /football/match-rounds', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MatchRoundsController)).toBe('football/match-rounds')
  })

  it('maps fund routes under /football/fund', () => {
    expect(Reflect.getMetadata(PATH_METADATA, FundController)).toBe('football/fund')
  })

  it('requires admin role for fund writes', () => {
    expect(Reflect.getMetadata(ROLES_KEY, FundController.prototype.create)).toEqual(['admin'])
    expect(Reflect.getMetadata(ROLES_KEY, FundController.prototype.update)).toEqual(['admin'])
    expect(Reflect.getMetadata(ROLES_KEY, FundController.prototype.remove)).toEqual(['admin'])
  })

  it('keeps profile and permission under /auth', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthController)).toBe('auth')
  })
})
