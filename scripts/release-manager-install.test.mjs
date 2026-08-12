import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

import { loadConfig } from '../ops/release-manager/lib/config.mjs'

const execFileAsync = promisify(execFile)
const packageRoot = path.resolve('ops/release-manager')

test('production config declares all 11 targets with fixed safety metadata', async () => {
  const config = await loadConfig(path.join(packageRoot, 'config/release-roots.conf.example'), {
    testMode: true,
  })
  const expected = [
    'club-admin',
    'club-api',
    'compass-admin',
    'compass-api',
    'crm-admin',
    'crm-api',
    'finance',
    'gaoge-admin',
    'gaoge-api',
    'gaoge-brand',
    'gaoge-sports',
  ]

  assert.deepEqual(config.targets.map((item) => item.id).sort(), expected)
  assert.equal(config.targets.find((item) => item.id === 'finance').state, 'planned')
  assert.equal(config.targets.filter((item) => item.state === 'enabled').length, 10)
  assert.ok(config.targets.every((item) => item.keepSuccessful === 3))
  assert.ok(config.targets.every((item) => item.failedTtlHours === 24))
  assert.ok(config.targets.every((item) => item.requiredPaths.length > 0))
  assert.deepEqual(config.targets.find((item) => item.id === 'gaoge-api').runtime.processNames, [
    'gaoge-api',
  ])
  assert.deepEqual(config.targets.find((item) => item.id === 'finance').runtime.processNames, [
    'finance-news-api',
    'finance-news-web',
  ])
})

test('installer stages an operational package without enabling timers or overwriting config', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'gaoge-install-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const installer = path.join(packageRoot, 'install.sh')

  await execFileAsync('bash', [installer, '--root', root])

  const configPath = path.join(root, 'etc/gaoge/release-roots.conf')
  const commandPath = path.join(root, 'usr/local/sbin/gaoge-release-manager')
  const servicePath = path.join(root, 'etc/systemd/system/gaoge-release-audit.service')
  assert.equal((await stat(configPath)).mode & 0o777, 0o640)
  assert.equal((await stat(commandPath)).mode & 0o777, 0o755)
  assert.match(await readFile(commandPath, 'utf8'), /exec \/usr\/bin\/node/)
  assert.match(await readFile(servicePath, 'utf8'), /prune --target all --max-delete 3 --json/)
  assert.match(
    await readFile(path.join(root, 'etc/sudoers.d/gaoge-release-manager'), 'utf8'),
    /deploy ALL=\(root\) NOPASSWD:/,
  )

  await writeFile(configPath, '{"preserved":true}\n')
  await execFileAsync('bash', [installer, '--root', root])
  assert.equal(await readFile(configPath, 'utf8'), '{"preserved":true}\n')
  await assert.rejects(
    () => execFileAsync('bash', [installer, '--root', root, '--activate']),
    /--activate is not allowed with --root/,
  )
})

test('systemd, cron and log policy encode bounded low-impact maintenance', async () => {
  const auditService = await readFile(
    path.join(packageRoot, 'systemd/gaoge-release-audit.service'),
    'utf8',
  )
  const auditTimer = await readFile(
    path.join(packageRoot, 'systemd/gaoge-release-audit.timer'),
    'utf8',
  )
  const reportTimer = await readFile(
    path.join(packageRoot, 'systemd/gaoge-release-report.timer'),
    'utf8',
  )
  const journald = await readFile(
    path.join(packageRoot, 'systemd/gaoge-journald-storage.conf'),
    'utf8',
  )
  const logrotate = await readFile(path.join(packageRoot, 'logrotate/gaoge-pm2'), 'utf8')
  const guard = await readFile(path.join(packageRoot, 'cron/gaoge-production-guard'), 'utf8')

  assert.match(auditService, /Type=oneshot/)
  assert.match(auditService, /Nice=19/)
  assert.match(auditService, /IOSchedulingClass=idle/)
  assert.match(auditTimer, /OnCalendar=\*-\*-\* 03:40:00/)
  assert.match(auditTimer, /RandomizedDelaySec=20m/)
  assert.match(reportTimer, /OnCalendar=Sun \*-\*-\* 04:20:00/)
  assert.match(journald, /SystemMaxUse=200M/)
  assert.match(logrotate, /\/root\/\.pm2\/logs\/\*\.log/)
  assert.match(logrotate, /\/home\/deploy\/\.pm2\/logs\/\*\.log/)
  assert.match(logrotate, /rotate 7/)
  assert.match(logrotate, /copytruncate/)
  assert.doesNotMatch(guard, /EXPECTED_RELEASE_(?:PATH|SHA)/)
  assert.match(guard, /@reboot root sleep 60/)
})
