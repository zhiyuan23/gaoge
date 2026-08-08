import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const API_FILTER = '@gaoge/app-api'
const EXPECTED_API_APP = '@gaoge/core-api'
const DEFAULT_HEALTH_URL = process.env.GAOGE_API_HEALTH_URL ?? 'http://127.0.0.1:3000/health'
const ENTRY_FILE_PATH = fileURLToPath(import.meta.url)

const TARGET_FILTERS = {
  admin: '@gaoge/app-admin',
  desktop: '@gaoge/app-desktop',
  miniapp: '@gaoge/app-miniapp',
  sports: '@gaoge/app-sports',
  uniapp: '@gaoge/app-uniapp',
}

export function isSupportedTarget(target) {
  return Object.hasOwn(TARGET_FILTERS, target)
}

export function buildTurboArgs(target, apiRunning) {
  const targetFilter = TARGET_FILTERS[target]

  if (!targetFilter) {
    throw new Error(`Unsupported target: ${target}`)
  }

  if (apiRunning) {
    return ['turbo', 'run', 'dev', `--filter=${targetFilter}`]
  }

  return ['turbo', 'run', 'dev', '--parallel', `--filter=${targetFilter}`, `--filter=${API_FILTER}`]
}

export async function createExecutionPlan(target, checkApiRunning) {
  if (!isSupportedTarget(target)) {
    throw new Error(`Unsupported target: ${target}`)
  }

  const apiRunning = await checkApiRunning()

  return {
    includeApi: !apiRunning,
    targetFilter: TARGET_FILTERS[target],
    args: buildTurboArgs(target, apiRunning),
  }
}

export async function probeApiHealth(fetchImpl = fetch, healthUrl = DEFAULT_HEALTH_URL) {
  try {
    const response = await fetchImpl(healthUrl, {
      signal: AbortSignal.timeout(1000),
    })

    if (!response.ok) {
      return false
    }

    const payload = await response.json()
    const health = payload?.data ?? payload

    return health?.app === EXPECTED_API_APP && health?.status === 'ok'
  } catch {
    return false
  }
}

export function resolvePnpmCommand(
  nodePath = process.execPath,
  npmExecPath = process.env.npm_execpath,
) {
  if (npmExecPath) {
    return {
      command: nodePath,
      args: [npmExecPath],
    }
  }

  return {
    command: 'pnpm',
    args: [],
  }
}

export function formatModeMessage(target, includeApi) {
  if (includeApi) {
    return `API is not running, starting api + ${target}`
  }

  return `API is running, starting ${target} only`
}

async function main() {
  const target = process.argv[2]
  const plan = await createExecutionPlan(target, probeApiHealth)
  const pnpmCommand = resolvePnpmCommand()

  console.log(formatModeMessage(target, plan.includeApi))

  const child = spawn(pnpmCommand.command, [...pnpmCommand.args, ...plan.args], {
    env: process.env,
    stdio: 'inherit',
  })

  child.on('error', (error) => {
    console.error(error.message)
    process.exit(1)
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 1)
  })
}

if (process.argv[1] === ENTRY_FILE_PATH) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
