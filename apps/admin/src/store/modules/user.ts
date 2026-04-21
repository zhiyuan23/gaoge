import apiUser from '@/api/modules/user'
import router from '@/router'

import useMenuStore from './menu'
import useRouteStore from './route'
import useSettingsStore from './settings'
import useTabbarStore from './tabbar'

const PLAYER_WRITE_PERMISSIONS = ['player:create', 'player:update', 'player:delete']

const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
    const settingsStore = useSettingsStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()
    const tabbarStore = useTabbarStore()

    const account = ref(localStorage.account ?? '')
    const token = ref(localStorage.token ?? '')
    const avatar = ref(localStorage.avatar ?? '')
    const role = ref(localStorage.role ?? '')
    const permissions = ref<string[]>([])
    const isLogin = computed(() => Boolean(token.value))
    const canManagePlayers = computed(() =>
      PLAYER_WRITE_PERMISSIONS.every((permission) => permissions.value.includes(permission)),
    )

    // 登录
    async function login(data: { account: string; password: string }) {
      const res = await apiUser.login(data)
      const { user, accessToken } = res as any
      localStorage.setItem('account', user.account ?? '')
      localStorage.setItem('token', accessToken)
      localStorage.setItem('avatar', user.avatarUrl ?? '')
      localStorage.setItem('role', user.role ?? '')
      account.value = user.account ?? ''
      token.value = accessToken
      avatar.value = user.avatarUrl ?? ''
      role.value = user.role ?? ''
      await getPermissions()
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
      localStorage.removeItem('avatar')
      localStorage.removeItem('role')
      account.value = ''
      avatar.value = ''
      role.value = ''
      permissions.value = []
      settingsStore.updateSettings({}, true)
      tabbarStore.clean()
      routeStore.removeRoutes()
      menuStore.setActived(0)
    }

    // 获取权限
    async function getPermissions() {
      const [permissionRes, profileRes] = await Promise.all([
        apiUser.permission(),
        apiUser.profile(),
      ])
      permissions.value = permissionRes.permissions
      role.value = profileRes.role
      avatar.value = profileRes.avatarUrl ?? ''
      account.value = profileRes.account ?? ''
      localStorage.setItem('role', role.value)
      localStorage.setItem('avatar', avatar.value)
      localStorage.setItem('account', account.value)
    }
    // 修改密码
    async function editPassword(data: { password: string; newPassword: string }) {
      await apiUser.passwordEdit(data)
    }

    return {
      account,
      token,
      avatar,
      role,
      permissions,
      isLogin,
      canManagePlayers,
      login,
      logout,
      requestLogout,
      getPermissions,
      editPassword,
    }
  },
)

export default useUserStore
