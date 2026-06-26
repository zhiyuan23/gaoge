import assert from 'node:assert/strict'

import {
  getLatestMatchRoundMetadata,
  isMatchRoundDefaultSearch,
} from '../src/views/sports/football/match-round/model/latest'
import { createMatchRoundSearchFields } from '../src/views/sports/football/match-round/schemas/search'

const defaultSearch = {
  year: 2025,
  season: '夏季赛',
  round: '',
  matchDate: '',
  venueKeyword: '',
} as const

const latestMatchRound = {
  id: 1,
  year: 2025,
  season: '夏季赛',
}

assert.deepEqual(getLatestMatchRoundMetadata(latestMatchRound), {
  previousMatchRound: latestMatchRound,
  defaultSearch,
})

assert.deepEqual(getLatestMatchRoundMetadata(null), {
  previousMatchRound: null,
  defaultSearch: {
    year: '',
    season: '',
    round: '',
    matchDate: '',
    venueKeyword: '',
  },
})

assert.equal(isMatchRoundDefaultSearch({ ...defaultSearch }, defaultSearch), true)

assert.equal(isMatchRoundDefaultSearch({ ...defaultSearch, year: 2026 }, defaultSearch), false)

const searchFields = createMatchRoundSearchFields(defaultSearch)

for (const key of ['year', 'season']) {
  const field = searchFields.find((item) => item.key === key)

  assert.equal(field?.props?.valueOnClear, '')
}
