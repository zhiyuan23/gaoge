export interface CacheState {
  staleKeys: string[]
}

const cacheState: CacheState = {
  staleKeys: [],
}

export function getCacheState() {
  return cacheState
}

export function markCacheStale(key: string) {
  if (!cacheState.staleKeys.includes(key)) {
    cacheState.staleKeys.push(key)
  }
}

export function clearCacheStale(key: string) {
  cacheState.staleKeys = cacheState.staleKeys.filter((staleKey) => staleKey !== key)
}
