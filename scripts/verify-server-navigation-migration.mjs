import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const prismaRoot = join(repositoryRoot, 'apps/api/prisma')
const migrationsRoot = join(prismaRoot, 'migrations')
const navigationMigration = '20260826120000_add_server_driven_navigation'
const temporaryRoot = mkdtempSync(join(tmpdir(), 'gaoge-server-navigation-migration-'))
const dataDirectory = join(temporaryRoot, 'postgres')
const preNavigationPrismaRoot = join(temporaryRoot, 'prisma-before-navigation')
const port = String(58_000 + (process.pid % 1_000))
const databaseUser = 'gaoge_navigation_migration'
let postgresStarted = false

for (const command of ['initdb', 'pg_ctl', 'createdb', 'psql']) {
  if (spawnSync('sh', ['-c', `command -v ${command}`], { stdio: 'ignore' }).status !== 0) {
    throw new Error(`${command} is required for the server navigation migration drill`)
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

function migrateDeploy(name, schemaPath) {
  run(
    'pnpm',
    ['--filter', '@gaoge/app-api', 'exec', 'prisma', 'migrate', 'deploy', '--schema', schemaPath],
    { env: { DATABASE_URL: databaseUrl(name) } },
  )
}

function preparePreNavigationMigrations() {
  mkdirSync(join(preNavigationPrismaRoot, 'migrations'), { recursive: true })
  cpSync(join(prismaRoot, 'schema.prisma'), join(preNavigationPrismaRoot, 'schema.prisma'))
  for (const migrationName of readdirSync(migrationsRoot).filter(
    (entry) => /^\d/.test(entry) && entry < navigationMigration,
  )) {
    cpSync(
      join(migrationsRoot, migrationName),
      join(preNavigationPrismaRoot, 'migrations', migrationName),
      { recursive: true },
    )
  }
}

function insertLegacyTree() {
  query(
    'navigation_existing',
    `
      insert into "Menu" ("name", "title", "icon", "path", "routeName", "menuType", "sort", "status", "visible", "isBuiltIn", "updatedAt") values
        ('football', '定制高歌 FC', 'custom:football', '/sports/football', 'sportsFootball', 'catalog', 41, 'inactive', false, true, '2026-08-20T01:02:03Z'),
        ('content', '定制内容管理', 'custom:content', '/sports/content', 'sportsContent', 'catalog', 42, 'active', false, true, '2026-08-20T02:03:04Z'),
        ('system', '定制用户权限', 'custom:system', '/system', 'system', 'catalog', 43, 'inactive', true, true, '2026-08-20T03:04:05Z'),
        ('wechat', '定制微信管理', 'custom:wechat', '/wechat', 'wechat', 'catalog', 44, 'active', true, true, '2026-08-20T04:05:06Z');
    `,
  )
}

function assertExistingTree() {
  const roots = query(
    'navigation_existing',
    `select "routeName" from "Menu" where "parentId" is null order by sort, id;`,
  )
  if (roots !== 'sports\nsystemManagement') {
    throw new Error(`existing database roots differ from target topology: ${roots}`)
  }

  const parents = query(
    'navigation_existing',
    `select child."routeName" || '=' || parent."routeName" from "Menu" child join "Menu" parent on parent.id = child."parentId" where child."routeName" in ('sportsFootball', 'sportsContent', 'system', 'wechat') order by child."routeName";`,
  )
  if (
    parents !==
    'sportsContent=sports\nsportsFootball=sports\nsystem=systemManagement\nwechat=systemManagement'
  ) {
    throw new Error(`existing catalogs were not reparented exactly: ${parents}`)
  }

  const presentation = query(
    'navigation_existing',
    `select "routeName" || '|' || title || '|' || icon || '|' || sort || '|' || status || '|' || visible || '|' || to_char("updatedAt" at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') from "Menu" where "routeName" in ('sportsFootball', 'sportsContent', 'system', 'wechat') order by "routeName";`,
  )
  const expectedPresentation = [
    'sportsContent|定制内容管理|custom:content|42|active|false|2026-08-20 02:03:04',
    'sportsFootball|定制高歌 FC|custom:football|41|inactive|false|2026-08-20 01:02:03',
    'system|定制用户权限|custom:system|43|inactive|true|2026-08-20 03:04:05',
    'wechat|定制微信管理|custom:wechat|44|active|true|2026-08-20 04:05:06',
  ].join('\n')
  if (presentation !== expectedPresentation) {
    throw new Error(`migration overwrote administrator-owned presentation fields:\n${presentation}`)
  }

  const groupDefaults = query(
    'navigation_existing',
    `select "routeName" || '|' || title || '|' || coalesce(icon, '<null>') || '|' || coalesce(path, '<null>') || '|' || "menuType" || '|' || sort || '|' || status || '|' || visible || '|' || "isBuiltIn" from "Menu" where "routeName" in ('sports', 'systemManagement') order by sort;`,
  )
  if (
    groupDefaults !==
    'sports|高歌体育|<null>|<null>|group|0|active|true|true\nsystemManagement|系统管理|<null>|<null>|group|10|active|true|true'
  ) {
    throw new Error(`new group defaults differ from the built-in contract: ${groupDefaults}`)
  }

  if (
    query(
      'navigation_existing',
      `select last_value >= (select max(id) from "Menu") from "Menu_id_seq";`,
    ) !== 't'
  ) {
    throw new Error('Menu sequence does not cover migrated group ids')
  }
}

try {
  preparePreNavigationMigrations()
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

  for (const name of ['navigation_empty', 'navigation_existing']) {
    run('createdb', ['-h', '127.0.0.1', '-p', port, '-U', databaseUser, name])
  }

  migrateDeploy('navigation_empty', join(prismaRoot, 'schema.prisma'))
  if (
    query(
      'navigation_empty',
      `select string_agg("routeName", ',' order by sort) from "Menu" where "parentId" is null;`,
    ) !== 'sports,systemManagement'
  ) {
    throw new Error('empty database did not receive the two navigation groups')
  }

  migrateDeploy('navigation_existing', join(preNavigationPrismaRoot, 'schema.prisma'))
  insertLegacyTree()
  migrateDeploy('navigation_existing', join(prismaRoot, 'schema.prisma'))
  assertExistingTree()

  console.log(
    'Server navigation migration drill passed: empty deploy and existing old-tree deploy without seed',
  )
} finally {
  if (postgresStarted) {
    try {
      run('pg_ctl', ['-D', dataDirectory, 'stop', '-m', 'fast'], { capture: true })
    } catch {}
  }
  rmSync(temporaryRoot, { recursive: true, force: true })
}
