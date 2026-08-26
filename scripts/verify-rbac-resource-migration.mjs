import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const migrationsRoot = join(repositoryRoot, 'apps/api/prisma/migrations')
const resourceMigration = '20260826090000_add_resource_rbac_foundation'
const temporaryRoot = mkdtempSync(join(tmpdir(), 'gaoge-rbac-resource-migration-'))
const dataDirectory = join(temporaryRoot, 'postgres')
const port = String(57_000 + (process.pid % 1_000))
const databaseUser = 'gaoge_migration'
let postgresStarted = false

for (const command of ['initdb', 'pg_ctl', 'createdb', 'psql']) {
  if (spawnSync('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' }).status !== 0) {
    throw new Error(`${command} is required for the RBAC migration drill`)
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, PGTZ: 'UTC', ...options.env },
    stdio: options.capture ? 'pipe' : 'inherit',
  })
}

function databaseUrl(name) {
  return `postgresql://${databaseUser}@127.0.0.1:${port}/${name}?schema=public`
}

function psqlUrl(name) {
  return `postgresql://${databaseUser}@127.0.0.1:${port}/${name}`
}

function query(name, sql) {
  return run('psql', [psqlUrl(name), '-v', 'ON_ERROR_STOP=1', '-Atqc', sql], {
    capture: true,
  }).trim()
}

function applyMigrationsBeforeResource(name) {
  const migrationNames = readdirSync(migrationsRoot)
    .filter((entry) => /^\d/.test(entry) && entry < resourceMigration)
    .sort()
  for (const migrationName of migrationNames) {
    run('psql', [
      psqlUrl(name),
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      join(migrationsRoot, migrationName, 'migration.sql'),
    ])
  }
}

function applyResourceMigration(name, capture = false) {
  return run(
    'psql',
    [
      psqlUrl(name),
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      join(migrationsRoot, resourceMigration, 'migration.sql'),
    ],
    { capture },
  )
}

function assertResourceState(name) {
  if (
    query(
      name,
      `select coalesce(column_default, '') from information_schema.columns where table_schema = 'public' and table_name = 'Resource' and column_name = 'updatedAt';`,
    ) !== ''
  ) {
    throw new Error(`${name} Resource.updatedAt database default differs from Prisma @updatedAt`)
  }
  if (query(name, 'select count(*) from "Permission" where "resourceId" is null;') !== '0') {
    throw new Error(`${name} contains permissions without Resource ownership`)
  }
  const menuResourceCount = query(name, 'select count(*) from "MenuResource";')
  const legacyViewCount = query(
    name,
    'select count(*) from (select distinct relation."menuId", permission."resourceId" from "MenuPermission" relation join "Permission" permission on permission."id" = relation."permissionId" where permission."action" = \'view\') legacy;',
  )
  if (menuResourceCount !== legacyViewCount) {
    throw new Error(`${name} MenuResource backfill differs from legacy view relations`)
  }
}

try {
  run('initdb', ['-D', dataDirectory, '--auth=trust', `--username=${databaseUser}`], {
    capture: true,
  })
  run('pg_ctl', [
    '-D',
    dataDirectory,
    '-l',
    join(temporaryRoot, 'postgres.log'),
    '-o',
    `-h 127.0.0.1 -p ${port} -c timezone=UTC`,
    'start',
  ])
  postgresStarted = true

  for (const name of ['rbac_empty', 'rbac_existing', 'rbac_invalid']) {
    run('createdb', ['-h', '127.0.0.1', '-p', port, '-U', databaseUser, name])
  }

  run('pnpm', ['--filter', '@gaoge/app-api', 'exec', 'prisma', 'migrate', 'deploy'], {
    env: { DATABASE_URL: databaseUrl('rbac_empty') },
  })
  if (query('rbac_empty', 'select to_regclass(\'"Resource"\') is not null;') !== 't') {
    throw new Error('empty database did not receive Resource')
  }
  if (query('rbac_empty', 'select to_regclass(\'"AuditEvent"\') is not null;') !== 't') {
    throw new Error('empty database did not receive AuditEvent')
  }

  applyMigrationsBeforeResource('rbac_existing')
  query(
    'rbac_existing',
    `insert into "Permission" ("code", "name", "module", "resource", "action", "status", "updatedAt") values ('custom.report.view', '查看自定义报表', 'custom', 'report', 'view', 'active', now()), ('custom.report.export', '导出自定义报表', 'custom', 'report', 'export', 'active', now()); insert into "Menu" ("name", "title", "path", "routeName", "menuType", "status", "visible", "updatedAt") values ('customReport', '自定义报表', '/custom/report', 'customReport', 'menu', 'active', true, now()); insert into "MenuPermission" ("menuId", "permissionId") select menu."id", permission."id" from "Menu" menu cross join "Permission" permission where menu."routeName" = 'customReport' and permission."code" = 'custom.report.view';`,
  )
  applyResourceMigration('rbac_existing')
  assertResourceState('rbac_existing')
  if (
    query('rbac_existing', 'select count(*) from "Resource" where "key" = \'custom.report\';') !==
    '1'
  ) {
    throw new Error('existing database did not backfill the custom resource')
  }

  applyMigrationsBeforeResource('rbac_invalid')
  query(
    'rbac_invalid',
    `insert into "Permission" ("code", "name", "module", "resource", "action", "status", "updatedAt") values ('invalid-code', '非法权限', 'custom', 'report', 'view', 'active', now());`,
  )
  try {
    applyResourceMigration('rbac_invalid', true)
    throw new Error('invalid legacy RBAC data unexpectedly passed migration preflight')
  } catch (error) {
    const output = `${error?.stdout ?? ''}${error?.stderr ?? ''}${error?.message ?? ''}`
    if (!output.includes('RBAC_RESOURCE_INVALID_CODE')) {
      throw error
    }
  }

  console.log('RBAC Resource migration drill passed: empty, existing, and invalid datasets')
} finally {
  if (postgresStarted) {
    try {
      run('pg_ctl', ['-D', dataDirectory, 'stop', '-m', 'fast'], { capture: true })
    } catch {}
  }
  rmSync(temporaryRoot, { recursive: true, force: true })
}
