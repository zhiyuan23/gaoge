import { lstat, readFile } from 'node:fs/promises'
import path from 'node:path'

export class ReleaseManagerError extends Error {
  constructor(message, exitCode, options) {
    super(message, options)
    this.name = new.target.name
    this.exitCode = exitCode
  }
}

export class ConfigError extends ReleaseManagerError {
  constructor(message, options) {
    super(message, 2, options)
  }
}

export class ConfigFileError extends ReleaseManagerError {
  constructor(message, options) {
    super(message, 3, options)
  }
}

const NUMERIC_SETTINGS = [
  'diskWarnPercent',
  'diskHardPercent',
  'minimumFreeKiB',
  'inodeHardPercent',
  'defaultKeepSuccessful',
  'failedTtlHours',
  'postDeployMaxDelete',
  'nightlyMaxDelete',
  'lockTimeoutSeconds',
  'loadPerCpuHard',
  'ioPressureAvg10Hard',
]

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isBelow(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return (
    relative !== '' &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== '..' &&
    !path.isAbsolute(relative)
  )
}

function assertAbsoluteBelow(prefix, candidate, label) {
  if (typeof candidate !== 'string' || !path.isAbsolute(candidate)) {
    throw new ConfigError(`${label} must be an absolute path`)
  }
  if (!isBelow(prefix, path.normalize(candidate))) {
    throw new ConfigError(`${label} must be below allowedRootPrefix`)
  }
}

function validateSettings(settings) {
  if (!isPlainObject(settings)) throw new ConfigError('settings must be an object')
  for (const key of NUMERIC_SETTINGS) {
    if (typeof settings[key] !== 'number' || !Number.isFinite(settings[key]) || settings[key] < 0) {
      throw new ConfigError(`invalid numeric setting: ${key}`)
    }
  }
  if (!path.isAbsolute(settings.allowedRootPrefix) || settings.allowedRootPrefix === '/') {
    throw new ConfigError('allowedRootPrefix must be a non-root absolute path')
  }
  if (settings.diskWarnPercent >= settings.diskHardPercent) {
    throw new ConfigError('diskWarnPercent must be below diskHardPercent')
  }
  if (settings.defaultKeepSuccessful < 2) {
    throw new ConfigError('defaultKeepSuccessful must be at least 2')
  }
}

function validateRuntime(runtime) {
  if (
    !isPlainObject(runtime) ||
    !['static', 'pm2'].includes(runtime.kind) ||
    !Array.isArray(runtime.processNames)
  ) {
    throw new ConfigError('invalid runtime configuration')
  }
  if (runtime.kind === 'static' && runtime.processNames.length > 0) {
    throw new ConfigError('static runtime cannot declare PM2 process names')
  }
  if (runtime.kind === 'pm2' && runtime.processNames.length === 0) {
    throw new ConfigError('pm2 runtime requires process names')
  }
  const seen = new Set()
  for (const processName of runtime.processNames) {
    if (typeof processName !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(processName)) {
      throw new ConfigError('invalid PM2 process name')
    }
    if (seen.has(processName)) throw new ConfigError(`duplicate PM2 process name: ${processName}`)
    seen.add(processName)
  }
}

function validateHealthUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0)
    throw new ConfigError('healthUrls must not be empty')
  for (const value of urls) {
    let url
    try {
      url = new URL(value)
    } catch {
      throw new ConfigError(`invalid health URL: ${value}`)
    }
    if (url.protocol !== 'https:') throw new ConfigError('health URL must use https')
    if (url.username || url.password)
      throw new ConfigError('health URL must not contain credentials')
  }
}

function validateRelativeArtifactPaths(requiredPaths) {
  if (!Array.isArray(requiredPaths) || requiredPaths.length === 0) {
    throw new ConfigError('requiredPaths must not be empty')
  }
  for (const requiredPath of requiredPaths) {
    if (
      typeof requiredPath !== 'string' ||
      requiredPath === '' ||
      path.isAbsolute(requiredPath) ||
      requiredPath.split(/[\\/]/).some((part) => part === '' || part === '.' || part === '..')
    ) {
      throw new ConfigError(`unsafe required path: ${requiredPath}`)
    }
  }
}

function validateTarget(settings, target) {
  if (!isPlainObject(target)) throw new ConfigError('target must be an object')
  if (typeof target.id !== 'string' || !/^[a-z][a-z0-9-]{1,63}$/.test(target.id)) {
    throw new ConfigError('invalid target id')
  }
  if (!['enabled', 'planned'].includes(target.state))
    throw new ConfigError(`invalid target state: ${target.id}`)

  const prefix = path.normalize(settings.allowedRootPrefix)
  if (path.normalize(target.releaseRoot) === prefix)
    throw new ConfigError('release root is too broad')
  assertAbsoluteBelow(prefix, target.releaseRoot, 'release root')
  assertAbsoluteBelow(prefix, target.currentLink, 'current link')
  assertAbsoluteBelow(prefix, target.previousLink, 'previous link')
  if (path.normalize(target.currentLink) === path.normalize(target.previousLink)) {
    throw new ConfigError('current and previous links must differ')
  }
  if (typeof target.owner !== 'string' || !/^[a-z_][a-z0-9_-]{0,31}$/.test(target.owner)) {
    throw new ConfigError('invalid target owner')
  }
  validateRuntime(target.runtime)
  validateHealthUrls(target.healthUrls)
  validateRelativeArtifactPaths(target.requiredPaths)
  if (target.auditPaths !== undefined && !Array.isArray(target.auditPaths)) {
    throw new ConfigError('auditPaths must be an array')
  }
  for (const auditPath of target.auditPaths ?? []) {
    assertAbsoluteBelow(prefix, auditPath, 'audit path')
  }
  for (const [key, value] of [
    ['keepSuccessful', target.keepSuccessful],
    ['failedTtlHours', target.failedTtlHours],
  ]) {
    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < (key === 'keepSuccessful' ? 2 : 1))
    ) {
      throw new ConfigError(`invalid target setting: ${key}`)
    }
  }
}

function deepFreeze(value) {
  if (!isPlainObject(value) && !Array.isArray(value)) return value
  for (const child of Object.values(value)) deepFreeze(child)
  return Object.freeze(value)
}

export function validateConfig(value) {
  if (!isPlainObject(value) || value.schemaVersion !== 1 || !Array.isArray(value.targets)) {
    throw new ConfigError('invalid release manager config')
  }
  validateSettings(value.settings)
  if (value.targets.length === 0) throw new ConfigError('targets must not be empty')
  const ids = new Set()
  for (const target of value.targets) {
    validateTarget(value.settings, target)
    if (ids.has(target.id)) throw new ConfigError(`duplicate target id: ${target.id}`)
    ids.add(target.id)
  }
  return deepFreeze(value)
}

export async function loadConfig(configPath, options = {}) {
  let metadata
  try {
    metadata = await lstat(configPath)
  } catch (error) {
    throw new ConfigFileError(`cannot stat config: ${configPath}`, { cause: error })
  }
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new ConfigFileError('config must be a regular file and not a symlink')
  }
  if (!options.testMode && metadata.uid !== 0)
    throw new ConfigFileError('config must be owned by root')
  if ((metadata.mode & 0o022) !== 0) {
    throw new ConfigFileError('config must not be writable by group or other')
  }

  let value
  try {
    value = JSON.parse(await readFile(configPath, 'utf8'))
  } catch (error) {
    throw new ConfigError('config is not valid JSON', { cause: error })
  }
  return validateConfig(value)
}

export function getTarget(config, id) {
  const target = config.targets.find((item) => item.id === id)
  if (!target) throw new ConfigError(`unknown target: ${id}`)
  return target
}
