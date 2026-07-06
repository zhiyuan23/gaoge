const allowedCorsOrigins = [
  'http://localhost:9527',
  'http://127.0.0.1:9527',
  'https://gaoge.cc',
  'https://www.gaoge.cc',
  'https://admin.gaoge.cc',
  'https://api.gaoge.cc',
]

const localAdminDevOriginPattern = /^http:\/\/(?:localhost|127\.0\.0\.1):90\d{2}$/

export function isAllowedCorsOrigin(origin?: string) {
  if (!origin) {
    return true
  }

  return allowedCorsOrigins.includes(origin) || localAdminDevOriginPattern.test(origin)
}

export function createCorsOptions() {
  return {
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      callback(null, isAllowedCorsOrigin(origin))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Token'],
  }
}
