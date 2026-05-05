import { bindUserReq, getSession, getSessionKeyReq, isLoginApi } from '@/api'
import { reLaunch, storage } from '@/utils'

const useAuthStore = defineStore(
  'auth',
  () => {
    const isLogin = ref<boolean>(false)
    const loading = ref(false)

    const setSessionKey = (sessionKey: string) => {
      storage.set('thirdSessionKey', sessionKey)
      isLogin.value = true
    }

    const logout = () => {
      isLogin.value = false
      storage.remove('thirdSessionKey')
    }

    // 检查是否登录
    const checkLogin = async () => {
      try {
        await isLoginApi()
        isLogin.value = true
      } catch {
        isLogin.value = false
      }
    }

    // 授权登录
    const login = async (phoneCode = '', redirect = false) => {
      if (loading.value) return

      loading.value = true
      try {
        const { code } = await uni.login()
        const res = await getSession({ wxCode: code, phoneCode })

        setSessionKey(res.thirdSessionKey)

        if (redirect) {
          reLaunch('/pages/home/index')
        }
      } catch {
        throw new Error('登录失败')
      } finally {
        loading.value = false
      }
    }

    const loginByAccount = async (username: string, password: string, redirect = false) => {
      if (loading.value) return

      loading.value = true
      try {
        const { code } = await uni.login()
        const session = await getSessionKeyReq({ code, orgType: 4 })

        setSessionKey(session.thirdSessionKey)
        await bindUserReq({ username, password, orgType: 4 })

        if (redirect) {
          reLaunch('/pages/home/index')
        }
      } catch (error) {
        logout()
        throw error
      } finally {
        loading.value = false
      }
    }

    return {
      isLogin,
      loading,

      checkLogin,
      login,
      loginByAccount,
      logout,
    }
  },
  {
    persist: {
      omit: ['loading'],
    },
  },
)

export default useAuthStore
