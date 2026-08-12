import { execFile as execFileCallback, execFileSync } from 'node:child_process'
import { lstat, readFile, realpath, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { ReleaseManagerError } from './config.mjs'

const execFile = promisify(execFileCallback)
const RELEASE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/

export class PathSafetyError extends ReleaseManagerError {
  constructor(message, options) {
    super(message, 3, options)
  }
}

export class DiskGateError extends ReleaseManagerError {
  constructor(message, options) {
    super(message, 4, options)
  }
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  )
}

export async function resolveDirectChild(releaseRoot, candidate) {
  const rootInput = path.resolve(releaseRoot)
  const candidateInput = path.resolve(candidate)
  const releaseId = path.basename(candidateInput)
  if (!RELEASE_ID_PATTERN.test(releaseId))
    throw new PathSafetyError(`unsafe release id: ${releaseId}`)
  if (!isWithin(rootInput, candidateInput))
    throw new PathSafetyError('candidate escapes release root')
  if (path.dirname(candidateInput) !== rootInput)
    throw new PathSafetyError('candidate must be a direct child')

  let candidateMetadata
  try {
    candidateMetadata = await lstat(candidateInput)
  } catch (error) {
    throw new PathSafetyError(`release directory does not exist: ${releaseId}`, { cause: error })
  }
  if (candidateMetadata.isSymbolicLink())
    throw new PathSafetyError('release directory must not be a symlink')
  if (!candidateMetadata.isDirectory())
    throw new PathSafetyError('release path must be a directory')

  const [realRoot, realCandidate] = await Promise.all([
    realpath(rootInput),
    realpath(candidateInput),
  ])
  if (path.dirname(realCandidate) !== realRoot)
    throw new PathSafetyError('candidate escapes release root')
  return realCandidate
}

export async function assertRequiredPaths(releasePath, requiredPaths) {
  const realRelease = await realpath(releasePath)
  for (const requiredPath of requiredPaths) {
    const candidate = path.join(realRelease, requiredPath)
    let metadata
    try {
      metadata = await stat(candidate)
    } catch (error) {
      throw new PathSafetyError(`missing required artifact: ${requiredPath}`, { cause: error })
    }
    if (!metadata.isFile())
      throw new PathSafetyError(`required artifact is not a file: ${requiredPath}`)
    const realCandidate = await realpath(candidate)
    if (!isWithin(realRelease, realCandidate)) {
      throw new PathSafetyError(`required artifact escapes release: ${requiredPath}`)
    }
  }
}

export function parseDfOutput(output, expectedMountPoint) {
  const lines = output.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length !== 2) throw new PathSafetyError('unexpected df output')
  const columns = lines[1].trim().split(/\s+/)
  if (columns.length < 6) throw new PathSafetyError('unexpected df output')
  const [filesystem, total, used, available, capacity, ...mountParts] = columns
  const mountPoint = mountParts.join(' ')
  const values = [total, used, available]
  if (values.some((value) => !/^\d+$/.test(value)) || !/^\d+%$/.test(capacity)) {
    throw new PathSafetyError('unexpected df numeric values')
  }
  if (mountPoint !== expectedMountPoint) {
    throw new PathSafetyError(`unexpected mount point: ${mountPoint}`)
  }
  if (!filesystem) throw new PathSafetyError('unexpected df filesystem')
  return {
    totalKiB: Number(total),
    usedKiB: Number(used),
    availableKiB: Number(available),
    percent: Number(capacity.slice(0, -1)),
    mountPoint,
  }
}

export function readDiskState(targetPath, runner = execFileSync) {
  const diskOutput = runner('df', ['-Pk', targetPath], { encoding: 'utf8' })
  const diskLines = diskOutput.trim().split(/\r?\n/)
  const mountPoint = diskLines.at(-1)?.trim().split(/\s+/).at(-1)
  if (!mountPoint) throw new PathSafetyError('cannot determine disk mount point')
  const disk = parseDfOutput(diskOutput, mountPoint)
  const inode = parseDfOutput(runner('df', ['-Pi', targetPath], { encoding: 'utf8' }), mountPoint)
  return {
    diskPercent: disk.percent,
    freeKiB: disk.availableKiB,
    inodePercent: inode.percent,
    mountPoint,
  }
}

export function preflightBlocked(settings, diskState) {
  return (
    diskState.diskPercent >= settings.diskHardPercent ||
    diskState.freeKiB < settings.minimumFreeKiB ||
    diskState.inodePercent >= settings.inodeHardPercent
  )
}

export function assertPreflight(settings, diskState) {
  const reasons = []
  if (diskState.diskPercent >= settings.diskHardPercent) {
    reasons.push(`disk usage ${diskState.diskPercent}% >= ${settings.diskHardPercent}%`)
  }
  if (diskState.freeKiB < settings.minimumFreeKiB) {
    reasons.push(`free space ${diskState.freeKiB} KiB < ${settings.minimumFreeKiB} KiB`)
  }
  if (diskState.inodePercent >= settings.inodeHardPercent) {
    reasons.push(`inode usage ${diskState.inodePercent}% >= ${settings.inodeHardPercent}%`)
  }
  if (reasons.length > 0)
    throw new DiskGateError(`release preflight blocked: ${reasons.join('; ')}`)
  const warnings = []
  if (diskState.diskPercent >= settings.diskWarnPercent) {
    warnings.push(`disk usage is at warning threshold: ${diskState.diskPercent}%`)
  }
  return { warnings }
}

export function parseIoPressure(contents) {
  const match = /^some\s+.*\bavg10=([0-9]+(?:\.[0-9]+)?)/m.exec(contents)
  return match ? Number(match[1]) : 0
}

export async function readResourceState(options = {}) {
  let contents = ''
  try {
    contents = await (options.readFile ?? readFile)('/proc/pressure/io', 'utf8')
  } catch {
    contents = ''
  }
  return {
    load1: (options.loadavg ?? os.loadavg)()[0],
    cpuCount: (options.cpus ?? os.cpus)().length,
    ioPressureAvg10: parseIoPressure(contents),
  }
}

export function resourceDeletionBlocked(settings, state) {
  return (
    state.load1 > state.cpuCount * settings.loadPerCpuHard ||
    state.ioPressureAvg10 >= settings.ioPressureAvg10Hard
  )
}

export function parsePm2Cwds(processNames, pm2Apps) {
  const allowed = new Set(processNames)
  const paths = new Set()
  for (const app of pm2Apps) {
    if (!allowed.has(app?.name)) continue
    if (typeof app.pm2_env?.pm_cwd === 'string' && path.isAbsolute(app.pm2_env.pm_cwd)) {
      paths.add(path.normalize(app.pm2_env.pm_cwd))
    }
    if (
      typeof app.pm2_env?.pm_exec_path === 'string' &&
      path.isAbsolute(app.pm2_env.pm_exec_path)
    ) {
      paths.add(path.dirname(path.normalize(app.pm2_env.pm_exec_path)))
    }
  }
  return paths
}

export function readPm2Cwds(processNames, options = {}) {
  let pm2Apps = options.pm2Json
  if (typeof pm2Apps === 'string') pm2Apps = JSON.parse(pm2Apps)
  if (!pm2Apps) {
    const owner = options.owner ?? 'root'
    const args =
      owner === 'root'
        ? ['jlist']
        : [
            '-u',
            owner,
            'env',
            `HOME=/home/${owner}`,
            `PM2_HOME=/home/${owner}/.pm2`,
            'pm2',
            'jlist',
          ]
    const command = owner === 'root' ? 'pm2' : 'sudo'
    pm2Apps = JSON.parse((options.runner ?? execFileSync)(command, args, { encoding: 'utf8' }))
  }
  if (!Array.isArray(pm2Apps)) throw new PathSafetyError('PM2 process list must be an array')
  return parsePm2Cwds(processNames, pm2Apps)
}

async function curlHealth(url, timeoutMs) {
  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000))
  const { stdout } = await execFile('curl', [
    '--fail',
    '--silent',
    '--show-error',
    '--max-time',
    String(timeoutSeconds),
    '--retry',
    '2',
    '--output',
    '/dev/null',
    '--write-out',
    '%{http_code}',
    url,
  ])
  return { statusCode: Number(stdout) }
}

export async function probeHealthUrls(urls, timeoutMs = 10_000, runner = curlHealth) {
  const results = []
  for (const url of urls) {
    try {
      const result = await runner(url, timeoutMs)
      results.push({ url, ok: true, statusCode: result.statusCode })
    } catch {
      results.push({ url, ok: false, error: 'health probe failed' })
    }
  }
  return results
}
