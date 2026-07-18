import { hasPerm } from '@/plugins/permission'
import { currentRoute } from '@/router'

/**
 * 页面 onShow 场景下的权限校验
 * 1. 微信小程序 tabbar 点击不会触发 uni.switchTab
 * 2. H5 浏览器地址栏输入 URL 不触发 uni 路由 API
 * 3. 首次启动加载的页面不触发 uni 路由 API
 */
export const usePermission = () => {
  return hasPerm(currentRoute())
}
