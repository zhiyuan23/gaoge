import { type RouteKey, Routes } from '../config/routes'

type QueryValue = string | number | boolean | undefined

export interface RouteOptions {
  query?: Record<string, QueryValue>
}

export function buildRoute(routeKey: RouteKey, options: RouteOptions = {}) {
  const basePath = Routes[routeKey]
  const query = options.query ?? {}
  const queryString = Object.entries(query)
    .filter((entry): entry is [string, string | number | boolean] => {
      return entry[1] !== undefined
    })
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')

  return queryString ? `${basePath}?${queryString}` : basePath
}

export function navigateTo(routeKey: RouteKey, options?: RouteOptions) {
  return wx.navigateTo({
    url: buildRoute(routeKey, options),
  })
}

export function redirectTo(routeKey: RouteKey, options?: RouteOptions) {
  return wx.redirectTo({
    url: buildRoute(routeKey, options),
  })
}
