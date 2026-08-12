import { randomUUID } from 'node:crypto'
import {
  mkdir,
  readdir,
  readFile,
  readlink,
  realpath,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'

import { ReleaseManagerError } from './config.mjs'
import {
  assertRequiredPaths,
  readPm2Cwds,
  readResourceState,
  resolveDirectChild,
  resourceDeletionBlocked,
} from './safety.mjs'

const HOUR = 60 * 60 * 1000
const DEFAULT_STATE_DIR = '/var/lib/gaoge-release-manager'

export class LockTimeoutError extends ReleaseManagerError {
  constructor(message, options) {
    super(message, 5, options)
  }
}

export class AuditError extends ReleaseManagerError {
  constructor(message, options) {
    super(message, 6, options)
  }
}

function sortByAgeThenId(items) {
  return items.sort((a, b) => a.mtimeMs - b.mtimeMs || a.id.localeCompare(b.id))
}

function protectedReason(id, inventory, successfulProtectedIds, ageMs, ttlMs) {
  if (id === inventory.currentId) return 'current'
  if (id === inventory.previousId) return 'previous'
  if (inventory.runtimeIds.includes(id)) return 'runtime-cwd'
  if (inventory.inProgressIds.includes(id)) return 'in-progress'
  if (ageMs < ttlMs) return 'young'
  if (successfulProtectedIds.has(id)) return 'successful-reserve'
  return null
}

function deletionReason(status) {
  if (status === 'failed') return 'expired-failed'
  if (status === 'incomplete') return 'expired-incomplete'
  if (status === 'successful' || status === 'legacy') return 'excess-successful'
  return null
}

export function buildPlan(target, inventory, now = Date.now()) {
  const releases = inventory.releases.map((release) => ({ ...release }))
  if (target.state === 'planned') {
    return {
      keep: releases.map((item) => ({ ...item, reason: 'planned' })),
      delete: [],
      unsafe: [],
      issues: [],
    }
  }
  if (inventory.issues.length > 0) {
    return {
      keep: releases.map((item) => ({ ...item, reason: 'unsafe' })),
      delete: [],
      unsafe: releases.map((item) => ({ ...item, reason: 'unsafe' })),
      issues: [...inventory.issues],
    }
  }

  const successfulProtectedIds = new Set(
    [inventory.currentId, inventory.previousId].filter(Boolean),
  )
  const successful = releases
    .filter((release) => release.status === 'successful' || release.status === 'legacy')
    .sort((a, b) => b.mtimeMs - a.mtimeMs || b.id.localeCompare(a.id))
  for (const item of successful) {
    if (successfulProtectedIds.size >= (target.keepSuccessful ?? 3)) break
    successfulProtectedIds.add(item.id)
  }

  const keep = []
  const candidates = []
  const unsafe = []
  const ttlMs = (target.failedTtlHours ?? 24) * HOUR
  for (const item of releases) {
    if (item.unsafe) {
      const classified = { ...item, reason: 'unsafe' }
      keep.push(classified)
      unsafe.push(classified)
      continue
    }
    const ageMs = Math.max(0, now - item.mtimeMs)
    const reason = protectedReason(item.id, inventory, successfulProtectedIds, ageMs, ttlMs)
    if (reason) {
      keep.push({ ...item, reason })
      continue
    }
    const deleteReason = deletionReason(item.status)
    if (deleteReason) candidates.push({ ...item, reason: deleteReason })
    else {
      const classified = { ...item, reason: 'unsafe' }
      keep.push(classified)
      unsafe.push(classified)
    }
  }

  return {
    keep: sortByAgeThenId(keep),
    delete: sortByAgeThenId(candidates),
    unsafe: sortByAgeThenId(unsafe),
    issues: [],
  }
}

async function readLinkReleaseId(target, linkPath, options = {}) {
  let rawLink
  try {
    rawLink = await readlink(linkPath)
  } catch (error) {
    if (options.optional && error?.code === 'ENOENT') return null
    throw new AuditError(`missing or unreadable link: ${linkPath}`, { cause: error })
  }
  const resolved = path.resolve(path.dirname(linkPath), rawLink)
  let releasePath
  try {
    releasePath = await resolveDirectChild(target.releaseRoot, resolved)
  } catch (error) {
    throw new AuditError(`link target is unsafe: ${linkPath}`, { cause: error })
  }
  return { id: path.basename(releasePath), path: releasePath }
}

async function atomicSymlink(targetPath, linkPath) {
  await mkdir(path.dirname(linkPath), { recursive: true })
  const temporaryLink = path.join(
    path.dirname(linkPath),
    `.${path.basename(linkPath)}.next-${randomUUID()}`,
  )
  await symlink(targetPath, temporaryLink)
  try {
    await rename(temporaryLink, linkPath)
  } catch (error) {
    await rm(temporaryLink, { force: true })
    throw error
  }
}

export async function activateRelease(target, releaseId) {
  if (target.state !== 'enabled') throw new AuditError(`target is not enabled: ${target.id}`)
  const releasePath = await resolveDirectChild(
    target.releaseRoot,
    path.join(target.releaseRoot, releaseId),
  )
  await assertRequiredPaths(releasePath, target.requiredPaths)
  const oldCurrent = await readLinkReleaseId(target, target.currentLink, { optional: true })
  if (oldCurrent && oldCurrent.id !== releaseId)
    await atomicSymlink(oldCurrent.path, target.previousLink)
  await atomicSymlink(releasePath, target.currentLink)
  return { target: target.id, currentId: releaseId, previousId: oldCurrent?.id ?? null }
}

export async function rollbackLink(target) {
  const [current, previous] = await Promise.all([
    readLinkReleaseId(target, target.currentLink),
    readLinkReleaseId(target, target.previousLink),
  ])
  if (current.id === previous.id)
    throw new AuditError('current and previous resolve to the same release')
  await assertRequiredPaths(previous.path, target.requiredPaths)
  await atomicSymlink(previous.path, target.currentLink)
  return { target: target.id, fromId: current.id, currentId: previous.id }
}

async function atomicWriteJson(outputPath, value, mode = 0o600) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.tmp-${randomUUID()}`,
  )
  await writeFile(temporaryPath, `${JSON.stringify(value)}\n`, { mode, flag: 'wx' })
  try {
    await rename(temporaryPath, outputPath)
  } catch (error) {
    await rm(temporaryPath, { force: true })
    throw error
  }
  return outputPath
}

function validateMetadata(metadata) {
  if (
    !metadata ||
    typeof metadata.gitSha !== 'string' ||
    !/^[0-9a-f]{7,64}$/i.test(metadata.gitSha)
  ) {
    throw new AuditError('invalid git SHA metadata')
  }
  if (
    typeof metadata.workflowRun !== 'string' ||
    !/^[A-Za-z0-9._-]{1,100}$/.test(metadata.workflowRun)
  ) {
    throw new AuditError('invalid workflow run metadata')
  }
}

function inProgressPath(stateDir, target, releaseId) {
  return path.join(stateDir, 'in-progress', target.id, `${releaseId}.json`)
}

export async function registerReleaseStart(target, releaseId, metadata, options = {}) {
  validateMetadata(metadata)
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(releaseId))
    throw new AuditError('unsafe release id')
  const outputPath = inProgressPath(options.stateDir ?? DEFAULT_STATE_DIR, target, releaseId)
  return atomicWriteJson(outputPath, { target: target.id, releaseId, ...metadata })
}

export async function writeReleaseStatus(target, releaseId, status, metadata, options = {}) {
  validateMetadata(metadata)
  if (!['successful', 'failed'].includes(status))
    throw new AuditError(`invalid release status: ${status}`)
  const releasePath = await resolveDirectChild(
    target.releaseRoot,
    path.join(target.releaseRoot, releaseId),
  )
  const markerName = status === 'successful' ? '.release-success' : '.release-failed'
  const otherMarker = status === 'successful' ? '.release-failed' : '.release-success'
  const markerPath = await atomicWriteJson(path.join(releasePath, markerName), {
    status,
    target: target.id,
    releaseId,
    ...metadata,
    recordedAt: new Date().toISOString(),
  })
  await rm(path.join(releasePath, otherMarker), { force: true })
  await rm(inProgressPath(options.stateDir ?? DEFAULT_STATE_DIR, target, releaseId), {
    force: true,
  })
  return markerPath
}

async function releaseStatus(releasePath) {
  try {
    JSON.parse(await readFile(path.join(releasePath, '.release-success'), 'utf8'))
    return 'successful'
  } catch {}
  try {
    JSON.parse(await readFile(path.join(releasePath, '.release-failed'), 'utf8'))
    return 'failed'
  } catch {}
  return 'legacy'
}

async function runtimeReleaseIds(target, options = {}) {
  if (target.runtime.kind !== 'pm2') return []
  const runtimePaths = readPm2Cwds(target.runtime.processNames, {
    owner: target.owner,
    pm2Json: options.pm2Json,
  })
  const result = new Set()
  const realRoot = await realpath(target.releaseRoot)
  for (const runtimePath of runtimePaths) {
    let current = path.resolve(runtimePath)
    while (current !== path.dirname(current)) {
      if (path.dirname(current) === realRoot) {
        result.add(path.basename(current))
        break
      }
      current = path.dirname(current)
    }
  }
  return [...result]
}

async function inProgressState(target, stateDir, now) {
  const directory = path.join(stateDir, 'in-progress', target.id)
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return { active: [], expired: [] }
    throw error
  }
  const ttlMs = (target.failedTtlHours ?? 24) * HOUR
  const active = []
  const expired = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    const filePath = path.join(directory, entry.name)
    const metadata = await stat(filePath)
    const releaseId = entry.name.slice(0, -5)
    if (now - metadata.mtimeMs < ttlMs) active.push(releaseId)
    else expired.push(releaseId)
  }
  return { active, expired }
}

export async function inventoryTarget(target, options = {}) {
  const now = options.now ?? Date.now()
  if (target.state === 'planned') {
    return {
      currentId: null,
      previousId: null,
      runtimeIds: [],
      inProgressIds: [],
      releases: [],
      issues: [],
    }
  }
  const issues = []
  let currentId = null
  let previousId = null
  try {
    currentId =
      (await readLinkReleaseId(target, target.currentLink, { optional: true }))?.id ?? null
  } catch (error) {
    issues.push(error.message)
  }
  try {
    previousId =
      (await readLinkReleaseId(target, target.previousLink, { optional: true }))?.id ?? null
  } catch (error) {
    issues.push(error.message)
  }

  const progress = await inProgressState(target, options.stateDir ?? DEFAULT_STATE_DIR, now)
  const releases = []
  const entries = await readdir(target.releaseRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue
    const releasePath = path.join(target.releaseRoot, entry.name)
    try {
      await resolveDirectChild(target.releaseRoot, releasePath)
      const metadata = await stat(releasePath)
      releases.push({
        id: entry.name,
        path: releasePath,
        mtimeMs: metadata.mtimeMs,
        status: progress.expired.includes(entry.name)
          ? 'incomplete'
          : await releaseStatus(releasePath),
      })
    } catch (error) {
      releases.push({
        id: entry.name,
        path: releasePath,
        mtimeMs: now,
        status: 'unknown',
        unsafe: true,
      })
      issues.push(error.message)
    }
  }

  return {
    currentId,
    previousId,
    runtimeIds: await runtimeReleaseIds(target, options),
    inProgressIds: progress.active,
    releases,
    issues,
  }
}

export async function bootstrapTarget(target, options = {}) {
  if (target.state === 'planned') {
    return {
      target: target.id,
      currentId: null,
      previousId: null,
      proposedPreviousId: null,
      applied: false,
    }
  }
  const now = options.now ?? Date.now()
  const inventory = await inventoryTarget(target, options)
  if (inventory.issues.length > 0) {
    throw new AuditError(`cannot bootstrap unresolved target: ${target.id}`)
  }
  if (!inventory.currentId)
    throw new AuditError(`cannot bootstrap target without current: ${target.id}`)
  const current = inventory.releases.find((item) => item.id === inventory.currentId)
  if (!current) throw new AuditError(`current release is not present in inventory: ${target.id}`)
  await assertRequiredPaths(current.path, target.requiredPaths)

  let proposedPreviousId = inventory.previousId
  if (!proposedPreviousId) {
    const candidates = inventory.releases
      .filter((item) => item.id !== inventory.currentId && !item.unsafe)
      .sort((a, b) => b.mtimeMs - a.mtimeMs || b.id.localeCompare(a.id))
    for (const candidate of candidates) {
      try {
        await assertRequiredPaths(candidate.path, target.requiredPaths)
        proposedPreviousId = candidate.id
        break
      } catch {}
    }
  }

  const result = {
    target: target.id,
    currentId: inventory.currentId,
    previousId: inventory.previousId,
    proposedPreviousId: proposedPreviousId ?? null,
    applied: false,
  }
  if (!options.apply) return result

  await atomicWriteJson(path.join(current.path, '.release-success'), {
    status: 'successful',
    target: target.id,
    releaseId: current.id,
    gitSha: /^[0-9a-f]{7,64}$/i.test(current.id) ? current.id : null,
    workflowRun: 'bootstrap',
    recordedAt: new Date(now).toISOString(),
  })
  await rm(path.join(current.path, '.release-failed'), { force: true })
  if (!inventory.previousId && proposedPreviousId) {
    const previous = inventory.releases.find((item) => item.id === proposedPreviousId)
    await atomicSymlink(previous.path, target.previousLink)
  }
  return { ...result, applied: true }
}

async function defaultDeleteOne(candidatePath) {
  await rm(candidatePath, { recursive: true, force: false })
}

export async function runPrune(target, maxDelete, options = {}) {
  if (!Number.isInteger(maxDelete) || maxDelete < 0)
    throw new AuditError('maxDelete must be a non-negative integer')
  const inventoryProvider = options.inventoryProvider ?? (() => inventoryTarget(target, options))
  const resourceStateProvider = options.resourceStateProvider ?? readResourceState
  const deleteOne = options.deleteOne ?? defaultDeleteOne
  const settings = options.settings
  if (!settings) throw new AuditError('prune settings are required')

  const initialPlan = buildPlan(target, await inventoryProvider(), options.now ?? Date.now())
  const result = { target: target.id, deleted: [], skipped: [], candidates: initialPlan.delete }
  for (const candidate of initialPlan.delete) {
    if (result.deleted.length >= maxDelete) break
    if (resourceDeletionBlocked(settings, await resourceStateProvider())) {
      result.stoppedReason = 'resource-pressure'
      break
    }
    const freshPlan = buildPlan(target, await inventoryProvider(), options.now ?? Date.now())
    const freshCandidate = freshPlan.delete.find((item) => item.id === candidate.id)
    if (!freshCandidate) {
      result.skipped.push({ id: candidate.id, reason: 'reprotected' })
      continue
    }
    const safePath = await resolveDirectChild(target.releaseRoot, freshCandidate.path)
    await deleteOne(safePath)
    result.deleted.push({ id: candidate.id, path: safePath, reason: candidate.reason })
  }
  return result
}

export function inspectAuditPath(entries, now, ttlHours = 24) {
  const ttlMs = ttlHours * HOUR
  return entries
    .filter((entry) => now - entry.mtimeMs >= ttlMs)
    .map((entry) => ({ ...entry, reason: 'stale-temporary-item' }))
}

export async function writeAuditState(result, stateDir = DEFAULT_STATE_DIR) {
  return atomicWriteJson(path.join(stateDir, 'last-audit.json'), result)
}
