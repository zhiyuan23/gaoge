import { getJson } from './api'

export function fetchFootballStandings({ year, season }) {
  return getJson('/football/standings', { year, season })
}

export function fetchFootballAssetSummary() {
  return getJson('/football/asset-records/summary')
}

export function fetchFootballAssetRecords(params = {}) {
  return getJson('/football/asset-records', params)
}
