import { ERROR404_PATH, isPathExists, removeQueryString } from '@/router'

/**
 * 权限校验
 * @param path 页面路径
 * @returns 是否有权限
 */
export const hasPerm = (path = ''): boolean => {
  const normalizedPath = removeQueryString(path)

  if (!isPathExists(normalizedPath) && normalizedPath !== '/') {
    uni.redirectTo({ url: ERROR404_PATH })
    return false
  }

  return true
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
