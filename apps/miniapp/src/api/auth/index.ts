import api from '@/api/request'

interface MiniappLoginParams {
  wxCode: string
  phoneCode?: string
}

export const getSession = ({ wxCode }: MiniappLoginParams) =>
  api.jsonPost<any>('/auth/miniapp/login', { code: wxCode })

export const isLoginApi = () => api.get<any>('/auth/profile')
