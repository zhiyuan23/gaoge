import type { MiniappLoginResponse, MiniappMeResponse } from '@gaoge/shared-types'

import { loginByCode, logoutReq, requestMe } from '@/api/auth'
import { storage } from '@/utils'

const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(storage.get('accessToken'))
  const refreshToken = ref(storage.get('refreshToken'))
  const me = ref<MiniappMeResponse | null>(null)
  const bootstrapping = ref(false)

  const clearSession = () => {
    accessToken.value = ''
    refreshToken.value = ''
    me.value = null
    storage.clearAuth()
  }

  const setSession = (payload: MiniappLoginResponse) => {
    accessToken.value = payload.accessToken
    refreshToken.value = payload.refreshToken
    me.value = {
      user: payload.user,
      binding: payload.binding,
    }

    storage.set('accessToken', payload.accessToken)
    storage.set('refreshToken', payload.refreshToken)
  }

  const silentLogin = async () => {
    const code = await new Promise<string>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res) => {
          if (res.code) {
            resolve(res.code)
            return
          }

          reject(new Error('获取登录凭证失败'))
        },
        fail: reject,
      })
    })

    const payload = await loginByCode({ code })
    setSession(payload)

    return payload
  }

  const fetchMe = async () => {
    me.value = await requestMe()

    return me.value
  }

  const ensureSession = async () => {
    if (bootstrapping.value) {
      return
    }

    bootstrapping.value = true

    try {
      if (accessToken.value) {
        try {
          await fetchMe()
          return
        } catch {
          clearSession()
        }
      }

      await silentLogin()
      await fetchMe()
    } finally {
      bootstrapping.value = false
    }
  }

  const logout = async () => {
    try {
      if (accessToken.value) {
        await logoutReq()
      }
    } finally {
      clearSession()
    }
  }

  return {
    accessToken,
    refreshToken,
    me,
    bootstrapping,
    setSession,
    silentLogin,
    fetchMe,
    ensureSession,
    logout,
  }
})

export default useAuthStore
