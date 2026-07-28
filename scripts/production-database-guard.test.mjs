import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  parseDatabaseTarget,
  readDatabaseUrl,
  validateConfiguredTarget,
} from './deployment/production-database-guard.mjs'

const canonicalExpected = {
  host: '::1',
  port: 5432,
  database: 'gaoge_db',
}
const guardPath = path.join(process.cwd(), 'scripts/deployment/production-database-guard.mjs')

const writeEnv = (content) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'gaoge-database-guard-'))
  const envFile = path.join(directory, 'api.env')
  writeFileSync(envFile, content)
  return envFile
}

const createFakePostgresCommands = () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'gaoge-postgres-cli-'))
  const psql = path.join(directory, 'psql')
  const pgDump = path.join(directory, 'pg_dump')
  const pgRestore = path.join(directory, 'pg_restore')
  writeFileSync(
    psql,
    `#!/usr/bin/env node
process.stdout.write(process.env.FAKE_PSQL_OUTPUT || '')
process.stderr.write(process.env.FAKE_PSQL_ERROR || '')
process.exit(Number(process.env.FAKE_PSQL_EXIT || 0))
`,
  )
  writeFileSync(
    pgDump,
    `#!/usr/bin/env node
const fs = require('node:fs')
const fileIndex = process.argv.indexOf('--file')
if (fileIndex !== -1 && process.argv[fileIndex + 1]) {
  fs.writeFileSync(process.argv[fileIndex + 1], 'fake custom PostgreSQL dump')
}
process.stderr.write(process.env.FAKE_PG_DUMP_ERROR || '')
process.exit(Number(process.env.FAKE_PG_DUMP_EXIT || 0))
`,
  )
  writeFileSync(
    pgRestore,
    `#!/usr/bin/env node
process.stdout.write(process.env.FAKE_PG_RESTORE_OUTPUT ?? 'TABLE public User\\nTABLE public Player\\n')
process.stderr.write(process.env.FAKE_PG_RESTORE_ERROR || '')
process.exit(Number(process.env.FAKE_PG_RESTORE_EXIT || 0))
`,
  )
  chmodSync(psql, 0o755)
  chmodSync(pgDump, 0o755)
  chmodSync(pgRestore, 0o755)
  return directory
}

const runGuard = (arguments_, environment = {}) => {
  const fakeBin = createFakePostgresCommands()

  return spawnSync(process.execPath, [guardPath, ...arguments_], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...environment,
      PATH: `${fakeBin}:${process.env.PATH}`,
      EXPECTED_DATABASE_HOST: '::1',
      EXPECTED_DATABASE_PORT: '5432',
      EXPECTED_DATABASE_NAME: 'gaoge_db',
    },
  })
}

test('accepts the canonical Gaoge production database target', () => {
  const envFile = writeEnv(
    'DATABASE_URL="postgresql://gaoge_user:secret@[::1]:5432/gaoge_db?schema=public"\n',
  )
  const databaseUrl = readDatabaseUrl(envFile)

  assert.deepEqual(parseDatabaseTarget(databaseUrl), {
    protocol: 'postgresql:',
    host: '::1',
    port: 5432,
    database: 'gaoge_db',
    username: 'gaoge_user',
    password: 'secret',
  })
  assert.deepEqual(validateConfiguredTarget(envFile, canonicalExpected), {
    protocol: 'postgresql:',
    host: '::1',
    port: 5432,
    database: 'gaoge_db',
    username: 'gaoge_user',
    password: 'secret',
  })
})

for (const databaseUrl of [
  'postgresql://gaoge_user:secret@127.0.0.1:5432/gaoge_db',
  'postgresql://gaoge_user:secret@localhost:5432/gaoge_db',
  'postgresql://gaoge_user:secret@[::1]:5433/gaoge_db',
  'postgresql://gaoge_user:secret@[::1]:5432/wrong_db',
]) {
  test(`rejects non-canonical target ${databaseUrl}`, () => {
    const envFile = writeEnv(`DATABASE_URL="${databaseUrl}"\n`)

    assert.throws(() => validateConfiguredTarget(envFile, canonicalExpected))
  })
}

test('rejects missing and duplicate DATABASE_URL lines', () => {
  assert.throws(() => readDatabaseUrl(writeEnv('APP_PORT=3000\n')))
  assert.throws(() =>
    readDatabaseUrl(writeEnv('DATABASE_URL="postgresql://one"\nDATABASE_URL="postgresql://two"\n')),
  )
})

const canonicalEnv = writeEnv(
  'DATABASE_URL="postgresql://gaoge_user:secret@[::1]:5432/gaoge_db?schema=public"\n',
)
const healthyProbe = {
  serverAddress: '::1',
  serverPort: 5432,
  database: 'gaoge_db',
  users: 7,
  players: 39,
  teams: 3,
  matches: 14,
  assets: 37,
}

test('probe accepts the canonical database with non-empty critical tables', () => {
  const result = runGuard(['probe', '--env-file', canonicalEnv], {
    FAKE_PSQL_OUTPUT: JSON.stringify(healthyProbe),
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /users=7 players=39 teams=3 matches=14 assets=37/)
  assert.doesNotMatch(result.stdout + result.stderr, /secret|gaoge_user/)
})

for (const field of ['users', 'players', 'teams', 'matches', 'assets']) {
  test(`probe rejects zero ${field}`, () => {
    const output = { ...healthyProbe, [field]: 0 }
    const result = runGuard(['probe', '--env-file', canonicalEnv], {
      FAKE_PSQL_OUTPUT: JSON.stringify(output),
    })

    assert.equal(result.status, 1)
    assert.match(result.stderr, new RegExp(`${field} must be greater than zero`))
  })
}

test('probe rejects an actual database identity mismatch', () => {
  const result = runGuard(['probe', '--env-file', canonicalEnv], {
    FAKE_PSQL_OUTPUT: JSON.stringify({
      ...healthyProbe,
      serverAddress: '127.0.0.1',
    }),
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /database identity mismatch/)
  assert.doesNotMatch(result.stderr, /secret|gaoge_user/)
})

test('probe rejects psql and malformed response failures without leaking credentials', () => {
  const failed = runGuard(['probe', '--env-file', canonicalEnv], {
    FAKE_PSQL_ERROR: 'connection failed',
    FAKE_PSQL_EXIT: '1',
  })
  const malformed = runGuard(['probe', '--env-file', canonicalEnv], {
    FAKE_PSQL_OUTPUT: 'not-json',
  })

  assert.equal(failed.status, 1)
  assert.match(failed.stderr, /database probe failed/)
  assert.equal(malformed.status, 1)
  assert.match(malformed.stderr, /invalid database probe response/)
  assert.doesNotMatch(
    failed.stdout + failed.stderr + malformed.stdout + malformed.stderr,
    /secret|gaoge_user/,
  )
})

const listDeploymentBackups = (backupDirectory) =>
  readdirSync(backupDirectory)
    .filter((name) => /^gaoge-db-pre-migration-\d{8}-\d{6}\.dump$/.test(name))
    .sort()

const seedBackups = (backupDirectory, count) => {
  mkdirSync(backupDirectory, { recursive: true })

  for (let index = 0; index < count; index += 1) {
    const second = String(index).padStart(2, '0')
    writeFileSync(
      path.join(backupDirectory, `gaoge-db-pre-migration-20260727-1200${second}.dump`),
      `backup-${index}`,
    )
  }
}

test('backup creates a verified custom dump and retains the newest fourteen', () => {
  const backupDirectory = mkdtempSync(path.join(tmpdir(), 'gaoge-database-backups-'))
  seedBackups(backupDirectory, 15)

  const result = runGuard([
    'backup',
    '--env-file',
    canonicalEnv,
    '--backup-dir',
    backupDirectory,
    '--retention',
    '14',
  ])
  const backups = listDeploymentBackups(backupDirectory)
  const newestBackup = path.join(backupDirectory, backups.at(-1))

  assert.equal(result.status, 0, result.stderr)
  assert.equal(backups.length, 14)
  assert.equal(statSync(newestBackup).mode & 0o777, 0o600)
  assert.equal(statSync(backupDirectory).mode & 0o777, 0o700)
  assert.match(result.stdout, /sha256=[a-f0-9]{64}/)
  assert.match(result.stdout, /bytes=\d+/)
  assert.doesNotMatch(result.stdout + result.stderr, /secret|gaoge_user/)
})

test('backup fails when pg_restore cannot read the dump', () => {
  const backupDirectory = mkdtempSync(path.join(tmpdir(), 'gaoge-database-backups-'))
  const result = runGuard(['backup', '--env-file', canonicalEnv, '--backup-dir', backupDirectory], {
    FAKE_PG_RESTORE_EXIT: '1',
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /backup verification failed/)
  assert.doesNotMatch(result.stderr, /secret|gaoge_user/)
})

test('backup fails when the verified dump inventory is empty', () => {
  const backupDirectory = mkdtempSync(path.join(tmpdir(), 'gaoge-database-backups-'))
  const result = runGuard(['backup', '--env-file', canonicalEnv, '--backup-dir', backupDirectory], {
    FAKE_PG_RESTORE_OUTPUT: '',
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /backup verification failed/)
})
