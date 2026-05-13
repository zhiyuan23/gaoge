import { getJson } from './api'

export function fetchFootballStandings({ year, season }) {
  return getJson('/football/standings', { year, season })
}
