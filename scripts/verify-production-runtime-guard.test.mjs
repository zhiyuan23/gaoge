import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

const workspaceRoot = process.cwd()

const readWorkspaceFile = (relativePath) =>
  readFileSync(path.join(workspaceRoot, relativePath), 'utf8')

test('remote runtime guard validates gaoge production process, release, database, and smoke checks', () => {
  const guardPath = 'scripts/deployment/verify-remote-runtime.sh'

  assert.equal(existsSync(path.join(workspaceRoot, guardPath)), true)

  const guard = readWorkspaceFile(guardPath)

  assert.match(guard, /EXPECTED_PM2_NAME/)
  assert.match(guard, /FORBIDDEN_PM2_NAMES/)
  assert.match(guard, /EXPECTED_DEPLOY_PATH/)
  assert.match(guard, /EXPECTED_RELEASE_PATH/)
  assert.match(guard, /EXPECTED_RELEASE_SHA/)
  assert.match(guard, /EXPECTED_DB_HOST/)
  assert.match(guard, /EXPECTED_DB_PORT/)
  assert.match(guard, /EXPECTED_DB_NAME/)
  assert.match(guard, /DATABASE_GUARD_PATH/)
  assert.match(guard, /production-database-guard\.mjs/)
  assert.match(guard, /readlink/)
  assert.match(guard, /pm2 jlist/)
  assert.match(guard, /CRITICAL_PATHS/)
  assert.match(guard, /NON_EMPTY_PATHS/)
  assert.match(guard, /response\?\.code !== 0/)
  assert.match(guard, /critical response code is not zero/)
  assert.match(guard, /data\.total/)
  assert.match(guard, /access-control-allow-methods/)
  assert.match(guard, /POST/)
  assert.match(guard, /curl -fsS/)
})

test('api deployment uses one database source and persists PM2 only after verification', () => {
  const workflow = readWorkspaceFile('.github/workflows/deploy-api.yml')
  const remoteWorkflow = workflow.replaceAll('\\', '')
  const rollback = readWorkspaceFile('scripts/deployment/rollback-api-release.sh')
  const snapshot = readWorkspaceFile('scripts/deployment/prepare-api-rollback-state.sh')

  assert.match(workflow, /group:\s+gaoge-production-deployment/)
  assert.match(workflow, /cancel-in-progress:\s+false/)
  assert.doesNotMatch(workflow, /secrets\.DATABASE_URL/)
  assert.equal(workflow.match(/postgresql:\/\/build:build@127\.0\.0\.1:1\/build/g)?.length, 2)
  assert.match(workflow, /echo Remote API migration started[\s\S]*date/)
  assert.match(workflow, /echo Restarting gaoge-api with PM2[\s\S]*date/)
  assert.doesNotMatch(workflow, /date '\+%F %T %Z'/)
  assert.match(workflow, /free -h \|\| true/)
  assert.match(workflow, /scripts\/deployment\/verify-remote-runtime\.sh/)
  assert.match(workflow, /scripts\/deployment\/production-database-guard\.mjs/)
  assert.match(workflow, /scripts\/deployment\/rollback-api-release\.sh/)
  assert.match(workflow, /scripts\/deployment\/prepare-api-rollback-state\.sh/)
  assert.match(workflow, /command -v realpath/)
  assert.match(workflow, /command -v cmp/)
  assert.match(workflow, /Number\.parseInt\(process\.versions\.node, 10\) !== 22/)
  assert.match(workflow, /api\.env\.next-\$RELEASE_ID/)
  assert.match(workflow, /mv .*NEXT_ENV_FILE.*SHARED_ENV_FILE/)
  assert.match(workflow, /env:\s+DEPLOY_ENV_FILE_API: \$\{\{ secrets\.DEPLOY_ENV_FILE_API \}\}/)
  assert.match(workflow, /printf '%s\\n' "\$DEPLOY_ENV_FILE_API"/)
  assert.doesNotMatch(workflow, /\. \.\/\.env/)
  assert.doesNotMatch(workflow, /DEPLOY_ENV_FILE_API \}\}[\s\S]*EOF/)
  assert.match(workflow, /production-database-guard\.mjs validate[\s\S]*--env-file/)
  assert.match(workflow, /production-database-guard\.mjs probe[\s\S]*--env-file/)
  assert.match(
    workflow,
    /production-database-guard\.mjs backup[\s\S]*--backup-dir[\s\S]*--retention 14/,
  )
  assert.ok(workflow.includes('env -i HOME=\\"\\$HOME\\" PATH=\\"\\$PATH\\"'))
  assert.match(
    remoteWorkflow,
    /env -i HOME="\$HOME" PATH="\$PATH"\s+node --env-file=\.env \.\/node_modules\/prisma\/build\/index\.js migrate deploy/,
  )
  assert.match(workflow, /id:\s+switch-release/)
  assert.match(workflow, /if:\s+failure\(\)/)
  assert.match(snapshot, /previous-release/)
  assert.match(snapshot, /previous-api\.env/)
  assert.match(snapshot, /had-api-env/)
  assert.match(snapshot, /no-api-env/)
  assert.match(snapshot, /cmp -s/)
  assert.match(workflow, /env-installing/)
  assert.match(workflow, /env-installed/)
  assert.match(workflow, /deploy-state\/\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/)
  assert.match(workflow, /gaoge-release-manager activate/)
  assert.doesNotMatch(workflow, /rm -rf .*current/)
  assert.match(rollback, /previous_release=\$\(realpath "\$recorded_release"/)
  assert.match(rollback, /\[ -f "\$previous_release\/ecosystem\.config\.cjs" \]/)
  assert.match(rollback, /\[ -f "\$previous_release\/dist\/main\.js" \]/)
  assert.match(rollback, /\[ "\$\(realpath "\$CURRENT_LINK"\)" = "\$previous_release" \]/)
  assert.match(workflow, /pm2 save/)
  assert.doesNotMatch(workflow, /NON_EMPTY_PATHS='[^']*&/)
  assert.match(workflow, /EXPECTED_PM2_NAME=\\"gaoge-api\\"/)
  assert.match(workflow, /FORBIDDEN_PM2_NAMES=\\"gaoge-server\\"/)
  assert.match(workflow, /EXPECTED_DEPLOY_PATH=\\"\$\{\{ secrets\.API_DEPLOY_PATH \}\}\\"/)
  assert.match(
    workflow,
    /EXPECTED_RELEASE_PATH=\\"\$\{\{ secrets\.API_DEPLOY_PATH \}\}\/releases\/api\/\$RELEASE_ID\\"/,
  )
  assert.match(workflow, /EXPECTED_DB_HOST=\\"\$\{\{ secrets\.EXPECTED_DATABASE_HOST \}\}\\"/)
  assert.match(workflow, /EXPECTED_DB_PORT=\\"5432\\"/)
  assert.match(workflow, /EXPECTED_DB_NAME=\\"gaoge_db\\"/)
  assert.match(workflow, /API_BASE_URL=\\"https:\/\/api\.gaoge\.cc\\"/)
  assert.match(workflow, /CRITICAL_PATHS=\\"\/health \/health\/db\\"/)
  assert.match(
    workflow,
    /NON_EMPTY_PATHS=\\"\/football\/players\?page=1&pageSize=1 \/football\/teams\?page=1&pageSize=1 \/football\/match-rounds\?page=1&pageSize=1 \/football\/asset-records\?page=1&pageSize=1\\"/,
  )
  assert.match(workflow, /CORS_ORIGIN=\\"https:\/\/admin\.gaoge\.cc\\"/)
  assert.match(workflow, /bash \$\{\{ secrets\.API_DEPLOY_PATH \}\}\/tmp\/rollback-api-release\.sh/)
  assert.match(rollback, /bash "\$RUNTIME_GUARD_PATH"/)
  assert.match(rollback, /env -i/)
  assert.match(rollback, /cleanup_rollback_state\(\)[\s\S]*trap cleanup_rollback_state EXIT/)
  assert.match(rollback, /run_pm2 save[\s\S]*rm -rf "\$STATE_DIR"/)

  const runtimeGuardStep = workflow.indexOf('运行 API 运行时守卫')
  const firstPm2Save = workflow.indexOf('pm2 save')
  assert.notEqual(runtimeGuardStep, -1)
  assert.ok(firstPm2Save > runtimeGuardStep)
})

test('Node env-file preserves shell-sensitive values without executing them', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'gaoge-safe-env-'))
  const marker = path.join(directory, 'must-not-exist')
  const envFile = path.join(directory, 'api.env')
  writeFileSync(
    envFile,
    [
      'DOLLAR_VALUE="value$HOME"',
      `COMMAND_VALUE="$(touch ${marker})"`,
      'SPACE_VALUE="hello world"',
      'DATABASE_URL="from-file"',
      '',
    ].join('\n'),
  )

  const result = spawnSync(
    'env',
    [
      '-i',
      `HOME=${process.env.HOME}`,
      `PATH=${process.env.PATH}`,
      process.execPath,
      `--env-file=${envFile}`,
      '-e',
      'process.stdout.write(JSON.stringify([process.env.DOLLAR_VALUE, process.env.COMMAND_VALUE, process.env.SPACE_VALUE, process.env.DATABASE_URL]))',
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: 'from-shell' },
    },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), [
    'value$HOME',
    `$(touch ${marker})`,
    'hello world',
    'from-file',
  ])
  assert.equal(existsSync(marker), false)
})

test('admin deployment verifies the API contract before switching frontend release', () => {
  const workflow = readWorkspaceFile('.github/workflows/deploy-admin.yml')

  assert.match(workflow, /group:\s+gaoge-production-deployment/)
  assert.match(workflow, /cancel-in-progress:\s+false/)
  assert.match(workflow, /ADMIN_API_CONTRACT_URLS/)
  assert.match(workflow, /校验 API 合约/)
  assert.match(workflow, /curl -fsS --retry 5 --retry-delay 3/)
  assert.match(workflow, /gaoge-release-manager activate/)
  assert.match(workflow, /--target '\$TARGET_ID' --release '\$RELEASE_ID'/)
})

test('api PM2 production runtime defaults to a single instance with override support', () => {
  const ecosystem = readWorkspaceFile('apps/api/ecosystem.config.cjs')

  assert.match(ecosystem, /parseEnv/)
  assert.match(ecosystem, /readFileSync\(`\$\{__dirname\}\/\.env`, 'utf8'\)/)
  assert.match(ecosystem, /parseInstances/)
  assert.match(ecosystem, /runtimeEnv\.PM2_INSTANCES/)
  assert.match(ecosystem, /\.\.\.runtimeEnv/)
  assert.match(ecosystem, /return 1/)
  assert.doesNotMatch(ecosystem, /instances:\s*'max'/)
})

test('api PM2 production runtime file overrides inherited process environment', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'gaoge-ecosystem-env-'))
  const ecosystemPath = path.join(directory, 'ecosystem.config.cjs')
  copyFileSync(path.join(workspaceRoot, 'apps/api/ecosystem.config.cjs'), ecosystemPath)
  writeFileSync(
    path.join(directory, '.env'),
    ['DATABASE_URL="postgresql://from-file"', 'APP_PORT="3456"', 'PM2_INSTANCES="2"', ''].join(
      '\n',
    ),
  )

  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `const config = require(${JSON.stringify(ecosystemPath)}); process.stdout.write(JSON.stringify(config.apps[0]))`,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://from-shell',
        APP_PORT: '9999',
        PM2_INSTANCES: '9',
      },
    },
  )

  assert.equal(result.status, 0, result.stderr)
  const app = JSON.parse(result.stdout)
  assert.equal(app.env.DATABASE_URL, 'postgresql://from-file')
  assert.equal(app.env.PORT, '3456')
  assert.equal(app.instances, 2)
})
