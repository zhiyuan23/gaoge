import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  symlink,
  utimes,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

import {
  buildFlockInvocation,
  parseCommandLine,
} from '../ops/release-manager/bin/gaoge-release-manager.mjs'
import {
  activateRelease,
  AuditError,
  bootstrapTarget,
  buildPlan,
  inventoryTarget,
  registerReleaseStart,
  rollbackLink,
  runPrune,
  writeAuditState,
  writeReleaseStatus,
} from '../ops/release-manager/lib/lifecycle.mjs'

const HOUR = 60 * 60 * 1000
const NOW = Date.parse('2026-08-12T12:00:00Z')
const execFileAsync = promisify(execFile)

function target(overrides = {}) {
  return {
    id: 'gaoge-api',
    state: 'enabled',
    releaseRoot: '/var/www/gaoge/api/releases/api',
    currentLink: '/var/www/gaoge/api/current',
    previousLink: '/var/www/gaoge/api/previous',
    owner: 'deploy',
    runtime: { kind: 'pm2', processNames: ['gaoge-api'] },
    healthUrls: ['https://api.gaoge.cc/health'],
    requiredPaths: ['dist/main.js', 'ecosystem.config.cjs'],
    auditPaths: [],
    keepSuccessful: 3,
    failedTtlHours: 24,
    ...overrides,
  }
}

function release(id, ageHours, status = 'successful', overrides = {}) {
  return {
    id,
    path: `/var/www/releases/${id}`,
    mtimeMs: NOW - ageHours * HOUR,
    status,
    ...overrides,
  }
}

function inventory(overrides = {}) {
  return {
    currentId: 'r5',
    previousId: 'r4',
    runtimeIds: [],
    inProgressIds: [],
    issues: [],
    releases: [
      release('r1', 120),
      release('r2', 96),
      release('r3', 72),
      release('r4', 48),
      release('r5', 2),
    ],
    ...overrides,
  }
}

async function releaseFixture(t) {
  const base = await mkdtemp(path.join(os.tmpdir(), 'gaoge-lifecycle-'))
  t.after(() => rm(base, { recursive: true, force: true }))
  const releaseRoot = path.join(base, 'releases')
  await mkdir(releaseRoot)
  const fixtureTarget = target({
    releaseRoot,
    currentLink: path.join(base, 'current'),
    previousLink: path.join(base, 'previous'),
    requiredPaths: ['dist/main.js', 'ecosystem.config.cjs'],
  })

  async function createRelease(id) {
    const releasePath = path.join(releaseRoot, id)
    await mkdir(path.join(releasePath, 'dist'), { recursive: true })
    await writeFile(path.join(releasePath, 'dist/main.js'), id)
    await writeFile(path.join(releasePath, 'ecosystem.config.cjs'), 'module.exports = {}')
    return releasePath
  }

  return { base, target: fixtureTarget, createRelease }
}

test('keeps current, previous and newest extra successful release', () => {
  const plan = buildPlan(target(), inventory(), NOW)

  assert.deepEqual(plan.keep.map((item) => item.id).sort(), ['r3', 'r4', 'r5'])
  assert.deepEqual(
    plan.delete.map((item) => item.id),
    ['r1', 'r2'],
  )
  assert.equal(plan.keep.find((item) => item.id === 'r5').reason, 'current')
  assert.equal(plan.delete[0].reason, 'excess-successful')
})

test('protects runtime, active deployments and all releases younger than 24 hours', () => {
  const plan = buildPlan(
    target(),
    inventory({
      runtimeIds: ['r2'],
      inProgressIds: ['failed-young'],
      releases: [
        release('r1', 120),
        release('r2', 120),
        release('r3', 72),
        release('r4', 48),
        release('r5', 2),
        release('failed-young', 30, 'incomplete'),
        release('untracked-young', 23, 'failed'),
      ],
    }),
    NOW,
  )

  assert.equal(plan.keep.find((item) => item.id === 'r2').reason, 'runtime-cwd')
  assert.equal(plan.keep.find((item) => item.id === 'failed-young').reason, 'in-progress')
  assert.equal(plan.keep.find((item) => item.id === 'untracked-young').reason, 'young')
})

test('expires failed, incomplete and excess legacy releases only after their TTL', () => {
  const plan = buildPlan(
    target(),
    inventory({
      releases: [
        release('r4', 48),
        release('r5', 2),
        release('legacy-newest', 72, 'legacy'),
        release('legacy-old', 96, 'legacy'),
        release('failed-old', 25, 'failed'),
        release('incomplete-old', 25, 'incomplete'),
        release('failed-young', 23, 'failed'),
      ],
    }),
    NOW,
  )

  assert.equal(plan.keep.find((item) => item.id === 'legacy-newest').reason, 'successful-reserve')
  assert.equal(plan.keep.find((item) => item.id === 'failed-young').reason, 'young')
  assert.deepEqual(
    plan.delete.map((item) => [item.id, item.reason]),
    [
      ['legacy-old', 'excess-successful'],
      ['failed-old', 'expired-failed'],
      ['incomplete-old', 'expired-incomplete'],
    ],
  )
})

test('never proposes deletion for planned or unresolved targets', () => {
  const planned = buildPlan(target({ state: 'planned' }), inventory(), NOW)
  assert.equal(planned.delete.length, 0)
  assert.ok(planned.keep.every((item) => item.reason === 'planned'))

  const unresolved = buildPlan(target(), inventory({ issues: ['current link escapes root'] }), NOW)
  assert.equal(unresolved.delete.length, 0)
  assert.ok(unresolved.keep.every((item) => item.reason === 'unsafe'))
  assert.deepEqual(unresolved.issues, ['current link escapes root'])
})

test('activation moves old current to previous before switching current', async (t) => {
  const fixture = await releaseFixture(t)
  const r1 = await fixture.createRelease('r1')
  const r2 = await fixture.createRelease('r2')
  await symlink(r1, fixture.target.currentLink)

  const result = await activateRelease(fixture.target, 'r2')

  assert.equal(await realpath(fixture.target.previousLink), await realpath(r1))
  assert.equal(await realpath(fixture.target.currentLink), await realpath(r2))
  assert.deepEqual(result, { target: 'gaoge-api', currentId: 'r2', previousId: 'r1' })
})

test('activation rejects a release missing configured artifacts', async (t) => {
  const fixture = await releaseFixture(t)
  const broken = path.join(fixture.target.releaseRoot, 'broken')
  await mkdir(broken)

  await assert.rejects(() => activateRelease(fixture.target, 'broken'), /missing required artifact/)
  assert.equal(existsSync(fixture.target.currentLink), false)
})

test('rollback restores previous current and rejects missing or identical links', async (t) => {
  const fixture = await releaseFixture(t)
  const r1 = await fixture.createRelease('r1')
  const r2 = await fixture.createRelease('r2')
  await symlink(r2, fixture.target.currentLink)
  await symlink(r1, fixture.target.previousLink)

  const result = await rollbackLink(fixture.target)
  assert.equal(await realpath(fixture.target.currentLink), await realpath(r1))
  assert.deepEqual(result, { target: 'gaoge-api', fromId: 'r2', currentId: 'r1' })

  await rm(fixture.target.previousLink)
  await assert.rejects(() => rollbackLink(fixture.target), AuditError)
  await rm(fixture.target.currentLink)
  await symlink(r1, fixture.target.currentLink)
  await symlink(r1, fixture.target.previousLink)
  await assert.rejects(
    () => rollbackLink(fixture.target),
    /current and previous resolve to the same release/,
  )
})

test('register and status markers are atomic and clear in-progress state', async (t) => {
  const fixture = await releaseFixture(t)
  const stateDir = path.join(fixture.base, 'state')
  const releasePath = await fixture.createRelease('r1')
  const metadata = { gitSha: 'a'.repeat(40), workflowRun: '123-1' }

  const statePath = await registerReleaseStart(fixture.target, 'r1', metadata, { stateDir })
  assert.deepEqual(JSON.parse(await readFile(statePath, 'utf8')), {
    target: 'gaoge-api',
    releaseId: 'r1',
    gitSha: 'a'.repeat(40),
    workflowRun: '123-1',
  })

  const marker = await writeReleaseStatus(fixture.target, 'r1', 'successful', metadata, {
    stateDir,
  })
  assert.equal(marker, path.join(await realpath(releasePath), '.release-success'))
  assert.equal(existsSync(statePath), false)
  assert.equal(existsSync(path.join(releasePath, '.release-failed')), false)
  assert.equal(JSON.parse(await readFile(marker, 'utf8')).status, 'successful')
})

test('prune revalidates candidates, respects maxDelete and stops on resource pressure', async (t) => {
  const fixture = await releaseFixture(t)
  const paths = {}
  for (const id of ['r1', 'r2', 'r3', 'r4', 'r5']) paths[id] = await fixture.createRelease(id)

  const baseInventory = inventory({
    releases: Object.entries(paths).map(([id, releasePath], index) => ({
      id,
      path: releasePath,
      mtimeMs: NOW - (120 - index * 24) * HOUR,
      status: 'successful',
    })),
  })
  const deleted = []
  const result = await runPrune(fixture.target, 1, {
    now: NOW,
    inventoryProvider: async () => baseInventory,
    resourceStateProvider: async () => ({ load1: 0, cpuCount: 4, ioPressureAvg10: 0 }),
    settings: { loadPerCpuHard: 1.5, ioPressureAvg10Hard: 20 },
    deleteOne: async (candidatePath) => deleted.push(candidatePath),
  })
  assert.equal(result.deleted.length, 1)
  assert.deepEqual(deleted, [await realpath(paths.r1)])

  let calls = 0
  const changed = await runPrune(fixture.target, 2, {
    now: NOW,
    inventoryProvider: async () => {
      calls += 1
      return calls === 1
        ? baseInventory
        : { ...baseInventory, runtimeIds: baseInventory.releases.map((item) => item.id) }
    },
    resourceStateProvider: async () => ({ load1: 0, cpuCount: 4, ioPressureAvg10: 0 }),
    settings: { loadPerCpuHard: 1.5, ioPressureAvg10Hard: 20 },
    deleteOne: async () => assert.fail('reprotected release must not be deleted'),
  })
  assert.equal(changed.deleted.length, 0)
  assert.equal(changed.skipped[0].reason, 'reprotected')

  const pressured = await runPrune(fixture.target, 2, {
    now: NOW,
    inventoryProvider: async () => baseInventory,
    resourceStateProvider: async () => ({ load1: 7, cpuCount: 4, ioPressureAvg10: 0 }),
    settings: { loadPerCpuHard: 1.5, ioPressureAvg10Hard: 20 },
    deleteOne: async () => assert.fail('resource pressure must stop deletion'),
  })
  assert.equal(pressured.stoppedReason, 'resource-pressure')
})

test('writes audit state atomically without leaving temporary files', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gaoge-audit-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const result = { status: 'healthy', targets: [{ id: 'gaoge-api', releases: 3 }] }

  const outputPath = await writeAuditState(result, root)

  assert.deepEqual(JSON.parse(await readFile(outputPath, 'utf8')), result)
  assert.deepEqual((await readdir(root)).sort(), ['last-audit.json'])
})

test('inventory classifies expired in-progress releases as incomplete', async (t) => {
  const fixture = await releaseFixture(t)
  await fixture.createRelease('unfinished')
  const stateDir = path.join(fixture.base, 'state')
  const statePath = await registerReleaseStart(
    fixture.target,
    'unfinished',
    { gitSha: 'b'.repeat(40), workflowRun: '456-1' },
    { stateDir },
  )
  const staleTime = new Date(NOW - 25 * HOUR)
  await utimes(statePath, staleTime, staleTime)

  const result = await inventoryTarget(
    { ...fixture.target, runtime: { kind: 'static', processNames: [] } },
    { stateDir, now: NOW },
  )

  assert.equal(result.inProgressIds.length, 0)
  assert.equal(result.releases.find((item) => item.id === 'unfinished').status, 'incomplete')
})

test('bootstrap previews then marks current and creates a verified previous link', async (t) => {
  const fixture = await releaseFixture(t)
  const r1 = await fixture.createRelease('r1')
  const r2 = await fixture.createRelease('r2')
  await symlink(r2, fixture.target.currentLink)
  const staticTarget = { ...fixture.target, runtime: { kind: 'static', processNames: [] } }

  const preview = await bootstrapTarget(staticTarget, { now: NOW, apply: false })
  assert.deepEqual(preview, {
    target: 'gaoge-api',
    currentId: 'r2',
    previousId: null,
    proposedPreviousId: 'r1',
    applied: false,
  })
  assert.equal(existsSync(fixture.target.previousLink), false)

  const applied = await bootstrapTarget(staticTarget, { now: NOW, apply: true })
  assert.equal(applied.applied, true)
  assert.equal(await realpath(fixture.target.previousLink), await realpath(r1))
  assert.equal(
    JSON.parse(await readFile(path.join(r2, '.release-success'), 'utf8')).status,
    'successful',
  )
})

test('parses stable CLI commands and rejects unknown or unsafe arguments', () => {
  assert.deepEqual(parseCommandLine(['plan', '--target', 'gaoge-api', '--json']), {
    command: 'plan',
    target: 'gaoge-api',
    json: true,
  })
  assert.deepEqual(
    parseCommandLine([
      'mark-failed',
      '--target',
      'gaoge-api',
      '--release',
      'r1',
      '--stage',
      'health',
    ]),
    { command: 'mark-failed', target: 'gaoge-api', release: 'r1', stage: 'health' },
  )
  assert.throws(
    () => parseCommandLine(['prune', '--target', 'gaoge-api', '--max-delete', '-1']),
    /invalid --max-delete/,
  )
  assert.throws(() => parseCommandLine(['unknown']), /unknown command/)
  assert.throws(
    () => parseCommandLine(['plan', '--target', 'gaoge-api', '--mystery']),
    /unknown option/,
  )
})

test('builds low-priority flock invocation only for prune workers', () => {
  assert.deepEqual(
    buildFlockInvocation({
      cliPath: '/opt/manager.mjs',
      lockPath: '/run/lock/gaoge-release-manager/global.lock',
      timeoutSeconds: 30,
      args: ['prune', '--target', 'all', '--max-delete', '3'],
      prune: true,
      nodePath: '/usr/bin/node',
    }),
    [
      '-w',
      '30',
      '/run/lock/gaoge-release-manager/global.lock',
      '/usr/bin/ionice',
      '-c3',
      '/usr/bin/nice',
      '-n',
      '19',
      '/usr/bin/node',
      '/opt/manager.mjs',
      '--lock-held',
      'prune',
      '--target',
      'all',
      '--max-delete',
      '3',
    ],
  )
  assert.deepEqual(
    buildFlockInvocation({
      cliPath: '/opt/manager.mjs',
      lockPath: '/run/lock/gaoge-release-manager/gaoge-api.lock',
      timeoutSeconds: 5,
      args: ['activate', '--target', 'gaoge-api', '--release', 'r1'],
      prune: false,
      nodePath: '/usr/bin/node',
    }),
    [
      '-w',
      '5',
      '/run/lock/gaoge-release-manager/gaoge-api.lock',
      '/usr/bin/node',
      '/opt/manager.mjs',
      '--lock-held',
      'activate',
      '--target',
      'gaoge-api',
      '--release',
      'r1',
    ],
  )
})

test('CLI version and plan JSON run against a real fixture', async (t) => {
  const fixture = await releaseFixture(t)
  const r1 = await fixture.createRelease('r1')
  await symlink(r1, fixture.target.currentLink)
  const configPath = path.join(fixture.base, 'release-roots.conf')
  const stateDir = path.join(fixture.base, 'state')
  await writeFile(
    configPath,
    JSON.stringify({
      schemaVersion: 1,
      settings: {
        diskWarnPercent: 70,
        diskHardPercent: 80,
        minimumFreeKiB: 5 * 1024 * 1024,
        inodeHardPercent: 80,
        defaultKeepSuccessful: 3,
        failedTtlHours: 24,
        postDeployMaxDelete: 1,
        nightlyMaxDelete: 3,
        lockTimeoutSeconds: 30,
        loadPerCpuHard: 1.5,
        ioPressureAvg10Hard: 20,
        allowedRootPrefix: fixture.base,
      },
      targets: [{ ...fixture.target, runtime: { kind: 'static', processNames: [] } }],
    }),
    { mode: 0o600 },
  )
  const cliPath = path.resolve('ops/release-manager/bin/gaoge-release-manager.mjs')
  const environment = {
    ...process.env,
    GAOGE_RELEASE_MANAGER_CONFIG: configPath,
    GAOGE_RELEASE_MANAGER_STATE_DIR: stateDir,
    GAOGE_RELEASE_MANAGER_TEST_MODE: '1',
  }

  const version = await execFileAsync(process.execPath, [cliPath, '--version'], {
    env: environment,
  })
  assert.match(version.stdout, /^gaoge-release-manager \d+\.\d+\.\d+\n$/)

  const planResult = await execFileAsync(
    process.execPath,
    [cliPath, '--lock-held', 'plan', '--target', 'gaoge-api', '--json'],
    { env: environment },
  )
  const output = JSON.parse(planResult.stdout)
  assert.equal(output.command, 'plan')
  assert.equal(output.target, 'gaoge-api')
  assert.equal(output.ok, true)
  assert.deepEqual(
    output.kept.map((item) => item.id),
    ['r1'],
  )
  assert.deepEqual(output.candidates, [])
})
