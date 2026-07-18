interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function setCache<T>(key: string, value: T, ttlMs: number, persist = false) {
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
  }

  memoryCache.set(key, entry)

  if (persist) {
    wx.setStorageSync(key, entry)
  }
}

export function getCache<T>(key: string): T | undefined {
  const entry = (memoryCache.get(key) ?? wx.getStorageSync(key)) as CacheEntry<T> | undefined

  if (!entry || entry.expiresAt <= Date.now()) {
    memoryCache.delete(key)
    wx.removeStorageSync(key)
    return undefined
  }

  memoryCache.set(key, entry)
  return entry.value
}

export function removeCache(key: string) {
  memoryCache.delete(key)
  wx.removeStorageSync(key)
}
