/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('node:fs')
const { parseEnv } = require('node:util')

let runtimeEnv = {}

try {
  runtimeEnv = parseEnv(readFileSync(`${__dirname}/.env`, 'utf8'))
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error
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
