import type {
  AuthRoleSummary,
  AuthUser,
  ChangePasswordPayload,
  UpdateAuthProfilePayload,
} from '@gaoge/shared-types'

import apiUser from '@/api/user'
import router from '@/router'

import useMenuStore from '../menu'
import useRouteStore from '../route'
import useSettingsStore from '../settings'
import useTabbarStore from '../tabbar'

const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    const settingsStore = useSettingsStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()
    const tabbarStore = useTabbarStore()

    const account = ref(localStorage.account ?? '')
    const nickname = ref(localStorage.nickname ?? '')
    const token = ref(localStorage.token ?? '')
    const avatar = ref(localStorage.avatar ?? '')
    const role = ref(localStorage.role ?? '')
    const permissions = ref<string[]>([])
    const profile = ref<AuthUser | null>(null)
    const roles = ref<AuthRoleSummary[]>([])
    const isLogin = computed(() => Boolean(token.value))
    const displayName = computed(() => nickname.value.trim() || account.value)

    function applyProfile(nextProfile: AuthUser) {
      profile.value = nextProfile
      account.value = nextProfile.account ?? ''
      nickname.value = nextProfile.nickname ?? ''
      avatar.value = nextProfile.avatarUrl ?? ''
      role.value = nextProfile.role ?? ''
      localStorage.setItem('account', account.value)
      localStorage.setItem('nickname', nickname.value)
      localStorage.setItem('avatar', avatar.value)
      localStorage.setItem('role', role.value)
    }

    // 登录
    async function login(data: { account: string; password: string }) {
      const res = await apiUser.login(data)
      const { user, accessToken } = res
      localStorage.setItem('token', accessToken)
      token.value = accessToken
      applyProfile(user)
    }

    // 手动登出
    async function logout(redirect = router.currentRoute.value.fullPath) {
      if (token.value) {
        try {
          await apiUser.logout()
        } catch {}
      }
      // 此处仅清除计算属性 isLogin 中判断登录状态过期的变量，以保证在弹出登录窗口模式下页面展示依旧正常
      localStorage.removeItem('token')
      token.value = ''
      router
        .push({
          name: 'login',
          query: {
            ...(redirect !== settingsStore.settings.home.fullPath &&
              router.currentRoute.value.name !== 'login' && { redirect }),
          },
        })
        .then(logoutCleanStatus)
    }
    // 请求登出
    function requestLogout() {
      // 此处仅清除计算属性 isLogin 中判断登录状态过期的变量，以保证在弹出登录窗口模式下页面展示依旧正常
      localStorage.removeItem('token')
      token.value = ''
      router
        .push({
          name: 'login',
          query: {
            ...(router.currentRoute.value.fullPath !== settingsStore.settings.home.fullPath &&
              router.currentRoute.value.name !== 'login' && {
                redirect: router.currentRoute.value.fullPath,
              }),
          },
        })
        .then(logoutCleanStatus)
    }
    // 登出后清除状态
    function logoutCleanStatus() {
      localStorage.removeItem('account')
      localStorage.removeItem('nickname')
      localStorage.removeItem('avatar')
      localStorage.removeItem('role')
      account.value = ''
      nickname.value = ''
      avatar.value = ''
      role.value = ''
      permissions.value = []
      profile.value = null
      roles.value = []
      settingsStore.updateSettings({}, true)
      tabbarStore.clean()
      routeStore.removeRoutes()
      menuStore.clearServerMenus()
      menuStore.setActived(0)
    }

    // 获取权限
    async function getPermissions() {
      const [permissionRes, profileRes] = await Promise.all([
        apiUser.permission(),
        apiUser.profile(),
      ])
      permissions.value = permissionRes.permissions
      roles.value = permissionRes.roles
      applyProfile(profileRes)
    }
    async function updateProfile(data: UpdateAuthProfilePayload) {
      const profileRes = await apiUser.updateProfile(data)
      applyProfile(profileRes)
      return profileRes
    }
    async function uploadAvatar(file: File) {
      const profileRes = await apiUser.uploadAvatar(file)
      applyProfile(profileRes)
      return profileRes
    }
    async function changePassword(data: ChangePasswordPayload) {
      return apiUser.changePassword(data)
    }
    // 修改密码
    async function editPassword(data: { password: string; newPassword: string }) {
      await apiUser.passwordEdit(data)
    }

    return {
      account,
      nickname,
      token,
      avatar,
      role,
      permissions,
      profile,
      roles,
      isLogin,
      displayName,
      login,
      logout,
      requestLogout,
      getPermissions,
      updateProfile,
      uploadAvatar,
      changePassword,
      editPassword,
    }
  },
)

export default useUserStore
