#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { lstat, mkdir, readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ConfigError, getTarget, loadConfig, ReleaseManagerError } from '../lib/config.mjs'
import {
  activateRelease,
  AuditError,
  bootstrapTarget,
  buildPlan,
  cleanupExpiredInProgress,
  inspectAuditPath,
  inventoryTarget,
  LockTimeoutError,
  registerReleaseStart,
  rollbackLink,
  runPrune,
  writeAuditState,
  writeReleaseStatus,
} from '../lib/lifecycle.mjs'
import {
  assertPreflight,
  probeHealthUrls,
  readDiskState,
  readResourceState,
} from '../lib/safety.mjs'

export const VERSION = '1.0.0'
const DEFAULT_CONFIG_PATH = '/etc/gaoge/release-roots.conf'
const DEFAULT_STATE_DIR = '/var/lib/gaoge-release-manager'
const DEFAULT_LOCK_DIR = '/run/lock/gaoge-release-manager'
const COMMANDS = new Set([
  'preflight',
  'register-start',
  'activate',
  'mark-success',
  'mark-failed',
  'plan',
  'prune',
  'audit',
  'report',
  'rollback',
  'bootstrap',
])
const BOOLEAN_OPTIONS = new Set(['--json', '--apply'])
const VALUE_OPTIONS = new Set([
  '--target',
  '--release',
  '--git-sha',
  '--workflow-run',
  '--stage',
  '--max-delete',
])
const ALLOWED_OPTIONS = {
  preflight: ['target'],
  'register-start': ['target', 'release', 'gitSha', 'workflowRun'],
  activate: ['target', 'release'],
  'mark-success': ['target', 'release', 'gitSha', 'workflowRun'],
  'mark-failed': ['target', 'release', 'stage'],
  plan: ['target', 'json'],
  prune: ['target', 'maxDelete', 'json'],
  audit: ['target', 'json'],
  report: ['target', 'json'],
  rollback: ['target'],
  bootstrap: ['target', 'apply', 'json'],
}
const REQUIRED_OPTIONS = {
  preflight: ['target'],
  'register-start': ['target', 'release', 'gitSha', 'workflowRun'],
  activate: ['target', 'release'],
  'mark-success': ['target', 'release', 'gitSha', 'workflowRun'],
  'mark-failed': ['target', 'release', 'stage'],
  plan: ['target'],
  prune: ['target', 'maxDelete'],
  audit: ['target'],
  report: ['target'],
  rollback: ['target'],
  bootstrap: ['target'],
}

function optionKey(option) {
  return option.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function parseCommandLine(args) {
  if (args.length === 1 && args[0] === '--version') return { command: 'version' }
  const [command, ...rest] = args
  if (!COMMANDS.has(command)) throw new ConfigError(`unknown command: ${command ?? ''}`)
  const result = { command }
  for (let index = 0; index < rest.length; index += 1) {
    const option = rest[index]
    if (BOOLEAN_OPTIONS.has(option)) {
      result[optionKey(option)] = true
      continue
    }
    if (!VALUE_OPTIONS.has(option)) throw new ConfigError(`unknown option: ${option}`)
    const value = rest[index + 1]
    if (!value || value.startsWith('--')) throw new ConfigError(`missing value for ${option}`)
    result[optionKey(option)] = value
    index += 1
  }
  const allowed = new Set(ALLOWED_OPTIONS[command])
  for (const key of Object.keys(result)) {
    if (key !== 'command' && !allowed.has(key))
      throw new ConfigError(`option is not valid for ${command}: ${key}`)
  }
  for (const key of REQUIRED_OPTIONS[command]) {
    if (result[key] === undefined) throw new ConfigError(`missing required option: --${key}`)
  }
  if (result.maxDelete !== undefined) {
    if (!/^\d+$/.test(result.maxDelete)) throw new ConfigError('invalid --max-delete')
    result.maxDelete = Number(result.maxDelete)
  }
  if (
    result.target === 'all' &&
    !['plan', 'prune', 'audit', 'report', 'bootstrap'].includes(command)
  ) {
    throw new ConfigError(`${command} does not accept --target all`)
  }
  return result
}

export function buildFlockInvocation({
  cliPath,
  lockPath,
  timeoutSeconds,
  args,
  prune,
  nodePath = process.execPath,
}) {
  const command = prune
    ? ['/usr/bin/ionice', '-c3', '/usr/bin/nice', '-n', '19', nodePath, cliPath]
    : [nodePath, cliPath]
  return ['-w', String(timeoutSeconds), lockPath, ...command, '--lock-held', ...args]
}

function targetsFor(config, targetId) {
  if (targetId === 'all') return [...config.targets].sort((a, b) => a.id.localeCompare(b.id))
  return [getTarget(config, targetId)]
}

async function totalBytes(root) {
  let total = 0
  const entries = await readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const candidate = path.join(root, entry.name)
    const metadata = await lstat(candidate)
    if (metadata.isSymbolicLink()) continue
    if (metadata.isDirectory()) total += await totalBytes(candidate)
    else if (metadata.isFile()) total += metadata.size
  }
  return total
}

async function staleAuditItems(target, now) {
  const results = []
  for (const auditPath of target.auditPaths ?? []) {
    let entries
    try {
      entries = await readdir(auditPath, { withFileTypes: true })
    } catch (error) {
      if (error?.code === 'ENOENT') continue
      throw error
    }
    const details = []
    for (const entry of entries) {
      const candidate = path.join(auditPath, entry.name)
      const metadata = await stat(candidate)
      details.push({
        path: candidate,
        mtimeMs: metadata.mtimeMs,
        bytes: entry.isDirectory() ? await totalBytes(candidate) : metadata.size,
      })
    }
    results.push(...inspectAuditPath(details, now, target.failedTtlHours ?? 24))
  }
  return results
}

async function planTarget(target, context) {
  const inventory = await inventoryTarget(target, {
    stateDir: context.stateDir,
    now: context.now,
  })
  const plan = buildPlan(target, inventory, context.now)
  return { inventory, plan }
}

async function auditTargets(config, selectedTargets, context, probe = true, cleanup = false) {
  const resource = await readResourceState()
  const reports = []
  let status = 'healthy'
  for (const target of selectedTargets) {
    if (target.state === 'planned') {
      reports.push({ id: target.id, state: 'planned', status: 'skipped', releases: 0 })
      continue
    }
    try {
      const expiredInProgress = cleanup
        ? await cleanupExpiredInProgress(target, context.stateDir, context.now)
        : { removed: [], retained: [] }
      const { inventory, plan } = await planTarget(target, context)
      const disk = readDiskState(target.releaseRoot)
      const health = probe ? await probeHealthUrls(target.healthUrls) : []
      const staleTemporaryItems = await staleAuditItems(target, context.now)
      const healthFailed = health.some((item) => !item.ok)
      const failed = inventory.issues.length > 0 || healthFailed
      const degraded =
        disk.diskPercent >= config.settings.diskWarnPercent || staleTemporaryItems.length > 0
      if (failed) status = 'failed'
      else if (degraded && status === 'healthy') status = 'degraded'
      reports.push({
        id: target.id,
        state: target.state,
        status: failed ? 'failed' : degraded ? 'degraded' : 'healthy',
        releases: inventory.releases.length,
        bytes: await totalBytes(target.releaseRoot),
        currentId: inventory.currentId,
        previousId: inventory.previousId,
        candidates: plan.delete.length,
        issues: inventory.issues,
        health,
        disk,
        staleTemporaryItems,
        expiredInProgress,
      })
    } catch (error) {
      status = 'failed'
      reports.push({ id: target.id, state: target.state, status: 'failed', error: error.message })
    }
  }
  return { status, resource, targets: reports }
}

function resultEnvelope(command, target, fields = {}) {
  return {
    command,
    target,
    ok: true,
    warnings: [],
    kept: [],
    candidates: [],
    deleted: [],
    disk: null,
    ...fields,
  }
}

async function readStartMetadata(stateDir, target, releaseId) {
  const statePath = path.join(stateDir, 'in-progress', target.id, `${releaseId}.json`)
  try {
    return JSON.parse(await readFile(statePath, 'utf8'))
  } catch (error) {
    throw new AuditError(`cannot read in-progress metadata for ${target.id}/${releaseId}`, {
      cause: error,
    })
  }
}

async function execute(parsed, config, context) {
  const selectedTargets = targetsFor(config, parsed.target)
  if (parsed.command === 'preflight') {
    const target = selectedTargets[0]
    if (target.state !== 'enabled') throw new AuditError(`target is not enabled: ${target.id}`)
    const disk = readDiskState(target.releaseRoot)
    const { warnings } = assertPreflight(config.settings, disk)
    let plan = null
    if (warnings.length > 0) plan = (await planTarget(target, context)).plan
    return resultEnvelope(parsed.command, target.id, {
      warnings,
      disk,
      candidates: plan?.delete ?? [],
    })
  }
  if (parsed.command === 'register-start') {
    const target = selectedTargets[0]
    const statePath = await registerReleaseStart(
      target,
      parsed.release,
      { gitSha: parsed.gitSha, workflowRun: parsed.workflowRun },
      { stateDir: context.stateDir },
    )
    return resultEnvelope(parsed.command, target.id, { release: parsed.release, statePath })
  }
  if (parsed.command === 'activate') {
    return resultEnvelope(
      parsed.command,
      parsed.target,
      await activateRelease(selectedTargets[0], parsed.release),
    )
  }
  if (parsed.command === 'mark-success') {
    const marker = await writeReleaseStatus(
      selectedTargets[0],
      parsed.release,
      'successful',
      { gitSha: parsed.gitSha, workflowRun: parsed.workflowRun },
      { stateDir: context.stateDir },
    )
    return resultEnvelope(parsed.command, parsed.target, { release: parsed.release, marker })
  }
  if (parsed.command === 'mark-failed') {
    const target = selectedTargets[0]
    const metadata = await readStartMetadata(context.stateDir, target, parsed.release)
    const marker = await writeReleaseStatus(
      target,
      parsed.release,
      'failed',
      { gitSha: metadata.gitSha, workflowRun: metadata.workflowRun, stage: parsed.stage },
      { stateDir: context.stateDir },
    )
    return resultEnvelope(parsed.command, parsed.target, { release: parsed.release, marker })
  }
  if (parsed.command === 'rollback') {
    return resultEnvelope(parsed.command, parsed.target, await rollbackLink(selectedTargets[0]))
  }
  if (parsed.command === 'plan') {
    const reports = []
    for (const target of selectedTargets) {
      const { plan } = await planTarget(target, context)
      reports.push({ target: target.id, ...plan })
    }
    if (reports.length === 1) {
      const report = reports[0]
      return resultEnvelope(parsed.command, report.target, {
        kept: report.keep,
        candidates: report.delete,
        unsafe: report.unsafe,
        issues: report.issues,
      })
    }
    return resultEnvelope(parsed.command, 'all', { targets: reports })
  }
  if (parsed.command === 'prune') {
    let remaining = parsed.maxDelete
    const reports = []
    for (const target of selectedTargets) {
      if (remaining === 0 || target.state === 'planned') continue
      const report =
        parsed.target === 'all'
          ? runLockedChild(
              ['prune', '--target', target.id, '--max-delete', String(remaining), '--json'],
              target.id,
              config,
              context,
              true,
            )
          : await runPrune(target, remaining, {
              stateDir: context.stateDir,
              now: context.now,
              settings: config.settings,
            })
      remaining -= report.deleted.length
      reports.push(report)
    }
    return resultEnvelope(parsed.command, parsed.target, {
      targets: reports,
      deleted: reports.flatMap((item) => item.deleted),
    })
  }
  if (parsed.command === 'audit' || parsed.command === 'report') {
    const report = await auditTargets(
      config,
      selectedTargets,
      context,
      true,
      parsed.command === 'audit',
    )
    const result = resultEnvelope(parsed.command, parsed.target, {
      ...report,
      ok: report.status !== 'failed',
    })
    if (parsed.command === 'audit') await writeAuditState(result, context.stateDir)
    return result
  }
  if (parsed.command === 'bootstrap') {
    const previews = []
    for (const target of selectedTargets)
      previews.push(await bootstrapTarget(target, { ...context, apply: false }))
    const unresolved = previews.filter(
      (item) => item.currentId && !item.previousId && !item.proposedPreviousId,
    )
    if (unresolved.length > 0) {
      throw new AuditError(
        `bootstrap has no verified previous candidate: ${unresolved.map((item) => item.target).join(', ')}`,
      )
    }
    const reports = []
    if (parsed.apply) {
      for (const target of selectedTargets) {
        if (parsed.target === 'all' && target.state === 'enabled') {
          const child = runLockedChild(
            ['bootstrap', '--target', target.id, '--apply', '--json'],
            target.id,
            config,
            context,
            false,
          )
          reports.push(...child.targets)
        } else reports.push(await bootstrapTarget(target, { ...context, apply: true }))
      }
    } else reports.push(...previews)
    return resultEnvelope(parsed.command, parsed.target, { targets: reports })
  }
  throw new ConfigError(`unsupported command: ${parsed.command}`)
}

function runLockedChild(args, targetId, config, context, prune) {
  const lockPath = path.join(context.lockDir, `${targetId}.lock`)
  const flockArgs = buildFlockInvocation({
    cliPath: context.cliPath,
    lockPath,
    timeoutSeconds: config.settings.lockTimeoutSeconds,
    args,
    prune,
  })
  const child = spawnSync('/usr/bin/flock', flockArgs, {
    encoding: 'utf8',
    env: process.env,
  })
  if (child.error)
    throw new LockTimeoutError(`failed to lock target: ${targetId}`, { cause: child.error })
  if (child.status !== 0) {
    if (child.stderr) process.stderr.write(child.stderr)
    if (child.status === 1) throw new LockTimeoutError(`lock timeout for target: ${targetId}`)
    throw new ReleaseManagerError(`locked child failed for target: ${targetId}`, child.status ?? 6)
  }
  try {
    return JSON.parse(child.stdout)
  } catch (error) {
    throw new AuditError(`locked child returned invalid JSON for target: ${targetId}`, {
      cause: error,
    })
  }
}

function printHuman(result) {
  process.stdout.write(
    `${result.command} target=${result.target} status=${result.status ?? (result.ok ? 'ok' : 'failed')}\n`,
  )
  for (const warning of result.warnings ?? []) process.stdout.write(`warning: ${warning}\n`)
  for (const item of result.kept ?? []) process.stdout.write(`keep ${item.id} ${item.reason}\n`)
  for (const item of result.candidates ?? [])
    process.stdout.write(`candidate ${item.id} ${item.reason}\n`)
  for (const item of result.deleted ?? [])
    process.stdout.write(`deleted ${item.id} ${item.reason}\n`)
}

function commandNeedsLock(parsed) {
  return (
    ['register-start', 'activate', 'mark-success', 'mark-failed', 'prune', 'rollback'].includes(
      parsed.command,
    ) ||
    (parsed.command === 'bootstrap' && parsed.apply)
  )
}

async function reexecuteWithLock(rawArgs, parsed, config, cliPath) {
  const lockDir = process.env.GAOGE_RELEASE_MANAGER_LOCK_DIR ?? DEFAULT_LOCK_DIR
  await mkdir(lockDir, { recursive: true, mode: 0o755 })
  const lockName =
    parsed.target === 'all' &&
    (parsed.command === 'prune' || (parsed.command === 'bootstrap' && parsed.apply))
      ? 'global'
      : parsed.target
  const lockPath = path.join(lockDir, `${lockName}.lock`)
  const flockArgs = buildFlockInvocation({
    cliPath,
    lockPath,
    timeoutSeconds: config.settings.lockTimeoutSeconds,
    args: rawArgs,
    prune: parsed.command === 'prune',
  })
  const result = spawnSync('/usr/bin/flock', flockArgs, { stdio: 'inherit' })
  if (result.error)
    throw new ReleaseManagerError('failed to execute flock', 5, { cause: result.error })
  return result.status === 0 ? 0 : result.status === 1 ? 5 : (result.status ?? 5)
}

export async function main(argv = process.argv.slice(2)) {
  const cliPath = fileURLToPath(import.meta.url)
  let lockHeld = false
  const rawArgs = [...argv]
  if (rawArgs[0] === '--lock-held') {
    lockHeld = true
    rawArgs.shift()
  }
  const parsed = parseCommandLine(rawArgs)
  if (parsed.command === 'version') {
    process.stdout.write(`gaoge-release-manager ${VERSION}\n`)
    return 0
  }
  const testMode = process.env.GAOGE_RELEASE_MANAGER_TEST_MODE === '1'
  const config = await loadConfig(process.env.GAOGE_RELEASE_MANAGER_CONFIG ?? DEFAULT_CONFIG_PATH, {
    testMode,
  })
  if (commandNeedsLock(parsed) && !lockHeld)
    return reexecuteWithLock(rawArgs, parsed, config, cliPath)
  const context = {
    cliPath,
    lockDir: process.env.GAOGE_RELEASE_MANAGER_LOCK_DIR ?? DEFAULT_LOCK_DIR,
    now: Date.now(),
    stateDir: process.env.GAOGE_RELEASE_MANAGER_STATE_DIR ?? DEFAULT_STATE_DIR,
  }
  const result = await execute(parsed, config, context)
  if (parsed.json) process.stdout.write(`${JSON.stringify(result)}\n`)
  else printHuman(result)
  return result.ok === false ? 6 : 0
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  try {
    process.exitCode = await main()
  } catch (error) {
    const exitCode = error instanceof ReleaseManagerError ? error.exitCode : 6
    process.stderr.write(`gaoge-release-manager: ${error.message}\n`)
    process.exitCode = exitCode
  }
}
