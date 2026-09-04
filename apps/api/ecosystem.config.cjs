/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('node:fs')
const { parseEnv } = require('node:util')

const OSS_ENV_KEYS = [
  'ALIYUN_OSS_REGION',
  'ALIYUN_OSS_BUCKET',
  'ALIYUN_OSS_ACCESS_KEY_ID',
  'ALIYUN_OSS_ACCESS_KEY_SECRET',
  'ALIYUN_OSS_PUBLIC_BASE_URL',
  'ALIYUN_OSS_PREFIX',
]

const readOptionalEnv = (filename) => {
  try {
    return parseEnv(readFileSync(`${__dirname}/${filename}`, 'utf8'))
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }

    return {}
  }
}

const runtimeEnv = parseEnv(readFileSync(`${__dirname}/.env`, 'utf8'))
const ossEnv = readOptionalEnv('.env.oss')

for (const key of OSS_ENV_KEYS) {
  if (ossEnv[key] !== undefined) {
    runtimeEnv[key] = ossEnv[key]
  }
}

const parseInstances = (value) => {
  if (!value) {
    return 1
  }

  if (value === 'max') {
    return value
  }

  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

module.exports = {
  apps: [
    {
      name: 'gaoge-api',
      cwd: __dirname,
      script: 'dist/main.js',
      instances: parseInstances(runtimeEnv.PM2_INSTANCES),
      exec_mode: 'cluster',
      env: {
        ...runtimeEnv,
        NODE_ENV: 'production',
        PORT: runtimeEnv.APP_PORT || 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      combine_logs: true,
      max_memory_restart: '512M',
    },
  ],
}
