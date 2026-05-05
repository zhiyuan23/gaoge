import { ERROR404_PATH, isPathExists, LOGIN_PATH, removeQueryString, routes } from '@/router'

// import { useAuthStore } from '@/store'

// const { isLogin } = storeToRefs(useAuthStore())
const isLogin = true

// 白名单路由
const whiteList: string[] = ['/']
routes.forEach((item) => {
  if (item.needLogin !== true) {
    whiteList.push(item.path)
  }
})

/**
 * 权限校验
 * @param path 页面路径
 * @returns 是否有权限
 */
export const hasPerm = (path = ''): boolean => {
  if (!isPathExists(path) && path !== '/') {
    uni.redirectTo({ url: ERROR404_PATH })
    return false
  }

  const normalizedPath = removeQueryString(path)

  // 在白名单或已登录 → 允许访问
  const hasPermission = whiteList.includes(normalizedPath) || isLogin

  if (!hasPermission) {
    // 未登录 → 跳登录页并携带 redirect 参数
    uni.redirectTo({
      url: `${LOGIN_PATH}?redirect=${encodeURIComponent(path)}`,
    })
  }

  return hasPermission
}

export const setupPermission = (): void => {
  // 拦截 uni 的路由导航方法
  const methods = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']

  methods.forEach((method) => {
    uni.addInterceptor(method, {
      invoke(args) {
        const url = typeof args.url === 'string' ? args.url : ''

        return hasPerm(url)
      },
    })
  })
}

export default setupPermission
