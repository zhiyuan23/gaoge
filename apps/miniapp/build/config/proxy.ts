import type { ProxyOptions } from 'vite'

interface ProxyEnv {
  VITE_APP_PROXY?: string
  VITE_API_PREFIX?: string
  VITE_API_BASE_URL?: string
}

export const createViteProxy = (env: ProxyEnv) => {
  const { VITE_APP_PROXY, VITE_API_PREFIX, VITE_API_BASE_URL } = env

  if (VITE_APP_PROXY !== 'true' || !VITE_API_PREFIX || !VITE_API_BASE_URL) {
    return undefined
  }

  const proxy: Record<string, ProxyOptions> = {
    [VITE_API_PREFIX]: {
      target: VITE_API_BASE_URL,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(new RegExp(`^${VITE_API_PREFIX}`), ''),
    },
  }

  return proxy
}
