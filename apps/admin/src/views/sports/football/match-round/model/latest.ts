import type { MatchRoundSearch } from './types'

interface LatestMatchRoundMetadata<MatchRound> {
  previousMatchRound: MatchRound | null
  defaultSearch: MatchRoundSearch
}

export function getLatestMatchRoundMetadata<
  MatchRound extends Pick<MatchRoundSearch, 'year' | 'season'>,
>(previousMatchRound: MatchRound | null): LatestMatchRoundMetadata<MatchRound> {
  return {
    previousMatchRound,
    defaultSearch: {
      year: previousMatchRound?.year ?? '',
      season: previousMatchRound?.season ?? '',
      round: '',
      matchDate: '',
      venueKeyword: '',
    },
  }
}

export function isMatchRoundDefaultSearch(
  search: MatchRoundSearch,
  defaultSearch: MatchRoundSearch,
) {
  return (
    search.year === defaultSearch.year &&
    search.season === defaultSearch.season &&
    search.round === defaultSearch.round &&
    search.matchDate === defaultSearch.matchDate &&
    search.venueKeyword === defaultSearch.venueKeyword
  )
}
