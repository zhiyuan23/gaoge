import type {
  MiniappBindOptionsResponse,
  MiniappLoginResponse,
  MiniappMeResponse,
} from '@gaoge/shared-types'

import api from '@/api/request'

export const loginByCode = (payload: { code: string }) =>
  api.jsonPost<MiniappLoginResponse>('/auth/miniapp/login', payload, { skipAuth: true })

export const refreshTokenReq = (refreshToken: string) =>
  api.jsonPost<Pick<MiniappLoginResponse, 'accessToken' | 'refreshToken'>>(
    '/auth/refresh-token',
    { refreshToken },
    { skipAuth: true, skipRefresh: true },
  )

export const requestMe = () => api.get<MiniappMeResponse>('/miniapp/me')

export const requestBindOptions = () =>
  api.get<MiniappBindOptionsResponse>('/miniapp/football-player/bind-options')

export const bindFootballPlayer = (playerNumber: number) =>
  api.jsonPost<MiniappMeResponse>('/miniapp/football-player/bind', { playerNumber })

export const logoutReq = () => api.post<{ message: string }>('/auth/logout')

export const locationInfo = (payload: { latitude: number; longitude: number }) =>
  api.post<any>('/wx/demo/common//locationInfo', payload, { skipAuth: true })

export const getProtocolConfig = () =>
  api.post<{ privacyPolicy: string; userAgreement: string }>(
    '/wx/demo/config/getProtocolConfig',
    {},
    { skipAuth: true },
  )
