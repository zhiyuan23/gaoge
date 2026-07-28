import { afterEach, describe, expect, it, vi } from 'vitest'

import * as api from './api'
import {
  fetchFootballAssetRecords,
  fetchFootballAssetSummary,
  fetchFootballStandings,
} from './football'

vi.mock('./api', () => ({
  getJson: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('football utils', () => {
  it('loads football standings with year and season params', async () => {
    api.getJson.mockResolvedValue({
      season: { year: 2026, season: '春季赛' },
      rounds: [],
      teams: [],
    })

    await fetchFootballStandings({ year: 2026, season: '春季赛' })

    expect(api.getJson).toHaveBeenCalledWith('/football/standings', {
      year: 2026,
      season: '春季赛',
    })
  })

  it('loads football asset summary from the summary endpoint', async () => {
    api.getJson.mockResolvedValue({
      totalIncome: 126000,
      totalExpense: 75698,
      balance: 50302,
      waivedMatchCount: 0,
    })

    await fetchFootballAssetSummary()

    expect(api.getJson).toHaveBeenCalledWith('/football/asset-records/summary')
  })

  it('loads football asset records with page and direction filters', async () => {
    api.getJson.mockResolvedValue({ list: [], total: 0 })

    await fetchFootballAssetRecords({
      page: 2,
      pageSize: 15,
      direction: 'expense',
    })

    expect(api.getJson).toHaveBeenCalledWith('/football/asset-records', {
      page: 2,
      pageSize: 15,
      direction: 'expense',
    })
  })
})
