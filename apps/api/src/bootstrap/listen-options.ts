interface ListenEnv {
  APP_HOST?: string
  APP_PORT?: string
  HOST?: string
  PORT?: string
}

export function resolveListenOptions(env: ListenEnv = process.env) {
  return {
    host: env.HOST ?? env.APP_HOST ?? '0.0.0.0',
    port: env.PORT ?? env.APP_PORT ?? 3000,
  }
}
