export const storage = {
  set(key: string | null, value: string | null) {
    if (key !== null && value !== null) uni.setStorageSync(key, value)
  },
  get(key: string | null) {
    if (key === null) return null

    return uni.getStorageSync(key)
  },
  setJSON(key: any, jsonValue: any) {
    if (jsonValue !== null) this.set(key, JSON.stringify(jsonValue))
  },
  getJSON(key: any) {
    const value = this.get(key)
    if (value) return JSON.parse(value)
  },
  remove(key: string) {
    uni.removeStorageSync(key)
  },

  setOrgId(value: any) {
    if (value !== null) uni.setStorageSync('orgId', value)
  },
  getOrgId() {
    const value = uni.getStorageSync('orgId')
    if (value) return value
  },

  setOrgName(value: any) {
    if (value !== null) uni.setStorageSync('orgName', value)
  },
  getOrgName() {
    const value = uni.getStorageSync('orgName')
    if (value) return value
  },

  setOrgCode(value: any) {
    if (value !== null) uni.setStorageSync('orgCode', value)
  },
  getOrgCode() {
    const value = uni.getStorageSync('orgCode')
    if (value) return value
  },

  setOrgType(value: any) {
    if (value !== null) uni.setStorageSync('orgType', value)
  },
  getOrgType() {
    const value = uni.getStorageSync('orgType')
    if (value) return value
  },

  setRealName(value: any) {
    if (value !== null) uni.setStorageSync('realName', value)
  },
  getRealName() {
    const value = uni.getStorageSync('realName')
    if (value) return value
  },

  setUserInfo(jsonValue: any) {
    if (jsonValue !== null) this.set('userInfo', JSON.stringify(jsonValue))
  },
  getUserInfo() {
    const value = this.get('userInfo')
    if (value) return JSON.parse(value)
  },

  clearStorage() {
    uni.clearStorageSync()
  },
}
