import type {
  CorsOptions,
  CustomOrigin,
} from '@nestjs/common/interfaces/external/cors-options.interface'

interface CorsEnv {
  NODE_ENV?: string
}

const productionOrigins = [
  'https://gaoge.cc',
  'https://www.gaoge.cc',
  'https://admin.gaoge.cc',
  'https://api.gaoge.cc',
]

const localDevOrigins = ['http://localhost:9527', 'http://127.0.0.1:9527']

const localAdminDevOriginPattern = /^http:\/\/(?:localhost|127\.0\.0\.1):90\d{2}$/

export function isAllowedCorsOrigin(origin: string, env: CorsEnv = process.env) {
  if (productionOrigins.includes(origin)) {
    return true
  }

  if (env.NODE_ENV === 'production') {
    return false
  }

  return localDevOrigins.includes(origin) || localAdminDevOriginPattern.test(origin)
}

export function createCorsOptions(env: CorsEnv = process.env): CorsOptions {
  const origin: CustomOrigin = (requestOrigin, callback) => {
    if (!requestOrigin || isAllowedCorsOrigin(requestOrigin, env)) {
      callback(null, true)
      return
    }

    callback(null, false)
  }

  return {
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Token'],
  }
}
