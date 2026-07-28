#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export class GuardError extends Error {}

export const readDatabaseUrl = (envFile) => {
  const lines = readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('DATABASE_URL='))

  if (lines.length !== 1) {
    throw new GuardError(`expected exactly one DATABASE_URL, found ${lines.length}`)
  }

  const value = lines[0].slice('DATABASE_URL='.length).trim()
  const quote = value.at(0)

  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1)
  }

  return value
}

export const parseDatabaseTarget = (databaseUrl) => {
  let parsed

  try {
    parsed = new URL(databaseUrl)
  } catch {
    throw new GuardError('DATABASE_URL is not a valid URL')
  }

  if (!['postgresql:', 'postgres:'].includes(parsed.protocol)) {
    throw new GuardError(`unsupported database protocol: ${parsed.protocol || 'missing'}`)
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (!parsed.hostname || !database || !parsed.username) {
    throw new GuardError('DATABASE_URL is missing host, database, or username')
  }

  return {
    protocol: parsed.protocol,
    host: parsed.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: Number(parsed.port || 5432),
    database,
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  }
}

export const validateConfiguredTarget = (envFile, expected) => {
  const target = parseDatabaseTarget(readDatabaseUrl(envFile))
  const actual = `${target.host}:${target.port}/${target.database}`
  const required = `${expected.host}:${expected.port}/${expected.database}`

  if (actual !== required) {
    throw new GuardError(`database target mismatch: got ${actual}, expected ${required}`)
  }

  return target
}

const PROBE_SQL = `
select json_build_object(
  'serverAddress', inet_server_addr()::text,
  'serverPort', inet_server_port(),
  'database', current_database(),
  'users', (select count(*) from "User"),
  'players', (select count(*) from "Player"),
  'teams', (select count(*) from "Team"),
  'matches', (select count(*) from "MatchRound"),
  'assets', (select count(*) from "FootballAssetRecord")
)::text;
`

const postgresEnvironment = (target) => ({
  ...process.env,
  PGHOST: target.host,
  PGPORT: String(target.port),
  PGDATABASE: target.database,
  PGUSER: target.username,
  PGPASSWORD: target.password,
})

export const probeDatabase = (target, expected) => {
  const result = spawnSync('psql', ['-X', '-A', '-t', '-q', '-c', PROBE_SQL], {
    encoding: 'utf8',
    env: postgresEnvironment(target),
  })

  if (result.error || result.status !== 0) {
    throw new GuardError('database probe failed')
  }

  let probe
  try {
    probe = JSON.parse(result.stdout.trim())
  } catch {
    throw new GuardError('invalid database probe response')
  }

  const actual = `${probe.serverAddress}:${probe.serverPort}/${probe.database}`
  const required = `${expected.host}:${expected.port}/${expected.database}`
  if (actual !== required) {
    throw new GuardError(`database identity mismatch: got ${actual}, expected ${required}`)
  }

  for (const field of ['users', 'players', 'teams', 'matches', 'assets']) {
    if (!Number.isInteger(Number(probe[field])) || Number(probe[field]) < 1) {
      throw new GuardError(`${field} must be greater than zero`)
    }
    probe[field] = Number(probe[field])
  }

  return probe
}

const backupTimestamp = (date = new Date()) =>
  date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)

export const backupDatabase = (target, backupDirectory, retention = 14) => {
  if (!Number.isInteger(retention) || retention < 1) {
    throw new GuardError('backup retention must be a positive integer')
  }

  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 })
  chmodSync(backupDirectory, 0o700)

  const backupName = `gaoge-db-pre-migration-${backupTimestamp()}.dump`
  const backupFile = path.join(backupDirectory, backupName)
  const dumpResult = spawnSync(
    'pg_dump',
    ['--format=custom', '--compress=9', '--no-owner', '--no-privileges', '--file', backupFile],
    { env: postgresEnvironment(target) },
  )

  if (dumpResult.error || dumpResult.status !== 0) {
    rmSync(backupFile, { force: true })
    throw new GuardError('database backup failed')
  }

  chmodSync(backupFile, 0o600)
  const restoreResult = spawnSync('pg_restore', ['--list', backupFile], {
    encoding: 'utf8',
  })
  if (restoreResult.error || restoreResult.status !== 0 || !restoreResult.stdout.trim()) {
    rmSync(backupFile, { force: true })
    throw new GuardError('backup verification failed')
  }

  const backup = readFileSync(backupFile)
  const checksum = createHash('sha256').update(backup).digest('hex')
  const matchingBackups = readdirSync(backupDirectory)
    .filter((name) => /^gaoge-db-pre-migration-\d{8}-\d{6}\.dump$/.test(name))
    .sort()
    .reverse()

  for (const expiredBackup of matchingBackups.slice(retention)) {
    rmSync(path.join(backupDirectory, expiredBackup))
  }

  return {
    name: backupName,
    size: statSync(backupFile).size,
    checksum,
  }
}

const parseArguments = (arguments_) => {
  const [command, ...options] = arguments_
  const values = {}

  for (let index = 0; index < options.length; index += 2) {
    const key = options[index]
    const value = options[index + 1]

    if (!key?.startsWith('--') || value === undefined) {
      throw new GuardError(`invalid option: ${key || 'missing'}`)
    }

    values[key.slice(2)] = value
  }

  return { command, values }
}

const expectedTarget = () => ({
  host: process.env.EXPECTED_DATABASE_HOST || '::1',
  port: Number(process.env.EXPECTED_DATABASE_PORT || 5432),
  database: process.env.EXPECTED_DATABASE_NAME || 'gaoge_db',
})

const main = () => {
  const { command, values } = parseArguments(process.argv.slice(2))
  const envFile = values['env-file']

  if (!envFile) {
    throw new GuardError('--env-file is required')
  }

  const expected = expectedTarget()
  const target = validateConfiguredTarget(envFile, expected)

  if (command === 'validate') {
    console.log(
      `[database-guard] configured target verified: ${target.host}:${target.port}/${target.database}`,
    )
    return
  }

  if (command === 'probe') {
    const probe = probeDatabase(target, expected)
    console.log(
      `[database-guard] verified ${target.host}:${target.port}/${target.database} users=${probe.users} players=${probe.players} teams=${probe.teams} matches=${probe.matches} assets=${probe.assets}`,
    )
    return
  }

  if (command === 'backup') {
    const backupDirectory = values['backup-dir']
    if (!backupDirectory) {
      throw new GuardError('--backup-dir is required')
    }

    const retention = values.retention ? Number(values.retention) : 14
    const backup = backupDatabase(target, backupDirectory, retention)
    console.log(
      `[database-guard] backup verified: ${backup.name} bytes=${backup.size} sha256=${backup.checksum}`,
    )
    return
  }

  throw new GuardError(`unsupported command: ${command || 'missing'}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main()
  } catch (error) {
    const message =
      error instanceof GuardError ? error.message : 'unexpected database guard failure'
    console.error(`[database-guard] ERROR: ${message}`)
    process.exitCode = 1
  }
}
