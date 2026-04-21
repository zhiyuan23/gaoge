import axios from 'axios'
// import qs from 'qs'
import { ElMessage } from 'element-plus'
import useUserStore from '@/store/modules/user'
import { getApiBaseUrl } from '@/utils/url'

const api = axios.create({
  baseURL:
    import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY
      ? import.meta.env.VITE_APP_API_PREFIX
      : getApiBaseUrl(),
  timeout: 1000 * 60,
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
})

declare module 'axios' {
  interface AxiosRequestConfig {
    noAuth?: boolean // 不需要携带鉴权token，默认false
    raw?: boolean // 是否返回原始axios响应，默认false
    toast?: boolean // 是否自动弹出错误提示，默认true
    fullRes?: boolean // 是否返回完整{code, data, errMsg}结构，默认false只返回data
  }

  // 覆盖axios默认的请求方法返回类型，适配我们拦截器直接返回data的逻辑
  interface AxiosInstance {
    request: <T = any>(config: AxiosRequestConfig) => Promise<T>
    get: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>
    delete: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>
    head: <T = any>(url: string, config?: AxiosRequestConfig) => Promise<T>
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => Promise<T>
  }
}

api.interceptors.request.use((request) => {
  // 全局拦截请求发送前提交的参数
  const userStore = useUserStore()

  // 设置请求头
  if (request.headers) {
    if (!request.noAuth && userStore.isLogin) {
      request.headers.Authorization = `Bearer ${userStore.token}`
    }
  }

  // 是否将 POST 请求参数进行字符串化处理
  // if (request.method === 'post') {
  //   request.data = qs.stringify(request.data, {
  //     arrayFormat: 'brackets',
  //   })
  // }
  return request
})

api.interceptors.response.use(
  (response) => {
    // 接口统一返回结构：{ code: number, data: any, errMsg: string }
    // code === 0 表示请求成功，其他为业务失败
    if (response.config.raw) {
      return Promise.resolve(response)
    }

    const payload = response.data

    // 特殊接口需要完整响应体的，直接返回全量结构
    if (response.config.fullRes) {
      return Promise.resolve(payload)
    }

    // 业务成功，直接返回data字段
    if (payload.code === 0) {
      return Promise.resolve(payload.data)
    }

    // 登录失效/未授权，跳转到登录页
    if (payload.code === 401) {
      useUserStore().requestLogout()
    }

    // 统一弹出业务错误提示
    if (payload.errMsg && response.config.toast !== false) {
      ElMessage.error(payload.errMsg)
    }

    // 业务错误直接返回，不抛出异常，页面不需要写catch
    return Promise.reject(payload)
  },
  (error) => {
    // 登录失效统一处理
    if (error.response?.status === 401 || error.code === 401) {
      useUserStore().requestLogout()
    }
    // 非业务异常（网络错误/超时/HTTP错误等）统一提示
    else if (error.config?.toast !== false) {
      let message = '请求失败'
      if (error.message === 'Network Error') {
        message = '后端网络故障'
      } else if (error.message.includes('timeout')) {
        message = '接口请求超时'
      } else if (error.response?.status) {
        message = `接口${error.response.status}异常`
      }
      ElMessage.error(message)
    }
    // 吞掉错误，不抛出异常，页面不需要写catch
    return Promise.reject(error)
  },
)

export default api
