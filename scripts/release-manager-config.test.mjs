import assert from 'node:assert/strict'
import { chmod, mkdir, mkdtemp, realpath, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  ConfigError,
  getTarget,
  loadConfig,
  validateConfig,
} from '../ops/release-manager/lib/config.mjs'
import {
  assertPreflight,
  assertRequiredPaths,
  DiskGateError,
  parseDfOutput,
  parseIoPressure,
  parsePm2Cwds,
  preflightBlocked,
  probeHealthUrls,
  readPm2Cwds,
  resolveDirectChild,
  resourceDeletionBlocked,
} from '../ops/release-manager/lib/safety.mjs'

function makeSettings(allowedRootPrefix = '/var/www') {
  return {
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
    allowedRootPrefix,
  }
}

function makeTarget(id = 'gaoge-api', base = '/var/www/gaoge/api') {
  return {
    id,
    state: 'enabled',
    releaseRoot: `${base}/releases`,
    currentLink: `${base}/current`,
    previousLink: `${base}/previous`,
    owner: 'deploy',
    runtime: { kind: 'pm2', processNames: ['gaoge-api'] },
    healthUrls: ['https://api.gaoge.cc/health'],
    requiredPaths: ['dist/main.js', 'ecosystem.config.cjs'],
    auditPaths: [`${base}/tmp`],
    keepSuccessful: 3,
    failedTtlHours: 24,
  }
}

function makeConfig(targets = [makeTarget()], allowedRootPrefix = '/var/www') {
  return { schemaVersion: 1, settings: makeSettings(allowedRootPrefix), targets }
}

test('validates a complete configuration and resolves targets', () => {
  const config = validateConfig(makeConfig())

  assert.equal(getTarget(config, 'gaoge-api').releaseRoot, '/var/www/gaoge/api/releases')
  assert.throws(() => getTarget(config, 'missing'), /unknown target: missing/)
})

test('rejects duplicate targets and roots that are too broad', () => {
  assert.throws(
    () => validateConfig(makeConfig([makeTarget(), makeTarget('gaoge-api', '/var/www/b')])),
    /duplicate target id: gaoge-api/,
  )
  assert.throws(
    () => validateConfig(makeConfig([makeTarget('bad', '/var')], '/var/www')),
    /must be below allowedRootPrefix/,
  )
  assert.throws(
    () =>
      validateConfig(
        makeConfig(
          [
            {
              ...makeTarget('bad', '/var/www'),
              releaseRoot: '/var/www',
            },
          ],
          '/var/www',
        ),
      ),
    /release root is too broad/,
  )
})

test('rejects unsafe artifact, audit and health paths', () => {
  assert.throws(
    () => validateConfig(makeConfig([{ ...makeTarget(), requiredPaths: ['../shared/api.env'] }])),
    /unsafe required path/,
  )
  assert.throws(
    () => validateConfig(makeConfig([{ ...makeTarget(), auditPaths: ['/tmp/deploy-state'] }])),
    /audit path must be below allowedRootPrefix/,
  )
  assert.throws(
    () =>
      validateConfig(makeConfig([{ ...makeTarget(), healthUrls: ['http://api.gaoge.cc/health'] }])),
    /health URL must use https/,
  )
})

test('loads JSON config in test mode and rejects writable config files', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gaoge-config-'))
  t.after(async () => {
    const { rm } = await import('node:fs/promises')
    await rm(root, { recursive: true, force: true })
  })
  const configPath = path.join(root, 'release-roots.conf')
  const config = makeConfig([makeTarget('fixture', path.join(root, 'app'))], root)
  await writeFile(configPath, JSON.stringify(config), { mode: 0o600 })

  const loaded = await loadConfig(configPath, { testMode: true })
  assert.equal(loaded.targets[0].id, 'fixture')

  await chmod(configPath, 0o666)
  await assert.rejects(
    () => loadConfig(configPath, { testMode: true }),
    /config must not be writable by group or other/,
  )
})

test('only accepts real direct child release directories', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gaoge-release-root-'))
  t.after(async () => {
    const { rm } = await import('node:fs/promises')
    await rm(root, { recursive: true, force: true })
  })
  const good = path.join(root, 'abc123')
  await mkdir(good)
  await mkdir(path.join(root, 'nested', 'child'), { recursive: true })
  await symlink(good, path.join(root, 'linked'))

  assert.equal(await resolveDirectChild(root, good), await realpath(good))
  await assert.rejects(
    () => resolveDirectChild(root, path.join(root, '..', 'outside')),
    /escapes release root/,
  )
  await assert.rejects(
    () => resolveDirectChild(root, path.join(root, 'nested', 'child')),
    /direct child/,
  )
  await assert.rejects(() => resolveDirectChild(root, path.join(root, '*')), /unsafe release id/)
  await assert.rejects(
    () => resolveDirectChild(root, path.join(root, 'linked')),
    /must not be a symlink/,
  )
})

test('requires configured artifacts before activation', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gaoge-artifacts-'))
  t.after(async () => {
    const { rm } = await import('node:fs/promises')
    await rm(root, { recursive: true, force: true })
  })
  await mkdir(path.join(root, 'dist'))
  await writeFile(path.join(root, 'dist', 'main.js'), 'ok')

  await assert.rejects(
    () => assertRequiredPaths(root, ['dist/main.js', 'ecosystem.config.cjs']),
    /missing required artifact: ecosystem.config.cjs/,
  )
  await writeFile(path.join(root, 'ecosystem.config.cjs'), 'module.exports = {}')
  await assertRequiredPaths(root, ['dist/main.js', 'ecosystem.config.cjs'])
})

test('parses POSIX df output and rejects malformed or mismatched mounts', () => {
  const disk = parseDfOutput(
    'Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/vda1 41152752 13500000 25500000 35% /\n',
    '/',
  )
  assert.deepEqual(disk, {
    totalKiB: 41152752,
    usedKiB: 13500000,
    availableKiB: 25500000,
    percent: 35,
    mountPoint: '/',
  })
  assert.throws(() => parseDfOutput('bad output\n', '/'), /unexpected df output/)
  assert.throws(
    () =>
      parseDfOutput(
        'Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/vda1 100 10 90 10% /data\n',
        '/',
      ),
    /unexpected mount point/,
  )
})

test('enforces disk, free-space and inode preflight boundaries', () => {
  const settings = makeSettings()
  for (const [diskPercent, freeKiB, inodePercent, blocked] of [
    [69, 6 * 1024 * 1024, 79, false],
    [70, 6 * 1024 * 1024, 79, false],
    [80, 6 * 1024 * 1024, 79, true],
    [60, 5 * 1024 * 1024 - 1, 79, true],
    [60, 6 * 1024 * 1024, 80, true],
  ]) {
    assert.equal(preflightBlocked(settings, { diskPercent, freeKiB, inodePercent }), blocked)
  }

  assert.deepEqual(
    assertPreflight(settings, { diskPercent: 70, freeKiB: 6 * 1024 * 1024, inodePercent: 79 }),
    { warnings: ['disk usage is at warning threshold: 70%'] },
  )
  assert.throws(
    () =>
      assertPreflight(settings, { diskPercent: 80, freeKiB: 6 * 1024 * 1024, inodePercent: 79 }),
    DiskGateError,
  )
})

test('parses Linux I/O pressure and blocks deletion at resource thresholds', () => {
  assert.equal(
    parseIoPressure(
      'some avg10=4.25 avg60=3.00 avg300=1.00 total=42\nfull avg10=0.10 avg60=0.05 avg300=0.01 total=2\n',
    ),
    4.25,
  )
  assert.equal(parseIoPressure(''), 0)
  const settings = makeSettings()
  assert.equal(
    resourceDeletionBlocked(settings, { load1: 5.9, cpuCount: 4, ioPressureAvg10: 19.9 }),
    false,
  )
  assert.equal(
    resourceDeletionBlocked(settings, { load1: 6.1, cpuCount: 4, ioPressureAvg10: 1 }),
    true,
  )
  assert.equal(
    resourceDeletionBlocked(settings, { load1: 1, cpuCount: 4, ioPressureAvg10: 20 }),
    true,
  )
})

test('extracts runtime paths only for configured PM2 process names', () => {
  const paths = parsePm2Cwds(
    ['gaoge-api'],
    [
      {
        name: 'gaoge-api',
        pm2_env: {
          pm_cwd: '/var/www/gaoge/api/releases/api/r1',
          pm_exec_path: '/var/www/gaoge/api/releases/api/r1/dist/main.js',
        },
      },
      {
        name: 'unrelated',
        pm2_env: {
          pm_cwd: '/var/www/unrelated/r9',
          pm_exec_path: '/var/www/unrelated/r9/server.js',
        },
      },
    ],
  )

  assert.deepEqual([...paths].sort(), [
    '/var/www/gaoge/api/releases/api/r1',
    '/var/www/gaoge/api/releases/api/r1/dist',
  ])
})

test('reads root-owned PM2 state from the root PM2 home without systemd HOME', () => {
  const paths = readPm2Cwds(['gaoge-club-api'], {
    owner: 'root',
    runner(_command, _args, options) {
      if (options.env?.HOME !== '/root' || options.env?.PM2_HOME !== '/root/.pm2') {
        return '[PM2][Initialization] Defaulting to /etc/.pm2\n[]'
      }
      return JSON.stringify([
        {
          name: 'gaoge-club-api',
          pm2_env: {
            pm_cwd: '/var/www/gaoge-club/api/releases/api/r1',
          },
        },
      ])
    },
  })

  assert.deepEqual([...paths], ['/var/www/gaoge-club/api/releases/api/r1'])
})

test('returns one health result per URL without leaking command output', async () => {
  const results = await probeHealthUrls(
    ['https://one.example/health', 'https://two.example/health'],
    10_000,
    async (url) => {
      if (url.includes('two')) throw new Error('curl exit 22: secret response body')
      return { statusCode: 204 }
    },
  )

  assert.deepEqual(results, [
    { url: 'https://one.example/health', ok: true, statusCode: 204 },
    { url: 'https://two.example/health', ok: false, error: 'health probe failed' },
  ])
})

test('configuration errors expose the stable config exit code', () => {
  const error = new ConfigError('bad config')
  assert.equal(error.exitCode, 2)
})
