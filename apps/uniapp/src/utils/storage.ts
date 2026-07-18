export const storage = {
  set(key: string | null, value: string | null) {
    if (key !== null && value !== null) uni.setStorageSync(key, value)
  },

  get(key: string | null) {
    if (key === null) return ''

    return String(uni.getStorageSync(key) ?? '')
  },

  setJSON(key: any, jsonValue: any) {
    if (jsonValue !== null) this.set(key, JSON.stringify(jsonValue))
  },

  getJSON(key: any) {
    const value = this.get(key)
    if (value) return JSON.parse(value)

    return null
  },

  syncAuthState(patch: Record<string, unknown>) {
    const current = this.getJSON('auth')
    const nextState =
      current && typeof current === 'object' ? { ...current, ...patch } : { ...patch }

    uni.setStorageSync('auth', JSON.stringify(nextState))
  },

  remove(key: string) {
    uni.removeStorageSync(key)
  },

  setOrgType(value: string) {
    this.set('orgType', value)
  },

  getOrgType() {
    return uni.getStorageSync('orgType')
  },

  clearAuth() {
    uni.removeStorageSync('accessToken')
    uni.removeStorageSync('refreshToken')
    this.syncAuthState({
      accessToken: '',
      refreshToken: '',
      me: null,
    })
  },

  clearStorage() {
    uni.clearStorageSync()
  },
}
