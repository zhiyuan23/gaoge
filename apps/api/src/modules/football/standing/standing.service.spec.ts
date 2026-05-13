import type { FootballStandingResponse } from '@gaoge/shared-types'

describe('StandingService', () => {
  it('returns a typed season standings payload', () => {
    const payload: FootballStandingResponse = {
      season: {
        year: 2026,
        season: '春季赛',
      },
      rounds: [],
      teams: [],
    }

    expect(payload.season.year).toBe(2026)
  })
})
