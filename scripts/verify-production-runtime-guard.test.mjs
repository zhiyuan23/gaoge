import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
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
  assert.match(guard, /data\.total/)
  assert.match(guard, /curl -fsS/)
})

test('api deployment uses one database source and persists PM2 only after verification', () => {
  const workflow = readWorkspaceFile('.github/workflows/deploy-api.yml')

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
  assert.match(workflow, /api\.env\.next-\$\{\{ github\.sha \}\}/)
  assert.match(workflow, /mv .*NEXT_ENV_FILE.*SHARED_ENV_FILE/)
  assert.match(workflow, /production-database-guard\.mjs validate[\s\S]*--env-file/)
  assert.match(workflow, /production-database-guard\.mjs probe[\s\S]*--env-file/)
  assert.match(
    workflow,
    /production-database-guard\.mjs backup[\s\S]*--backup-dir[\s\S]*--retention 14/,
  )
  assert.match(workflow, /set -a[\s\S]*\. \.\/\.env[\s\S]*set \+a/)
  assert.match(workflow, /id:\s+switch-release/)
  assert.match(workflow, /if:\s+failure\(\)/)
  assert.match(workflow, /previous-release/)
  assert.match(workflow, /previous-api\.env/)
  assert.match(workflow, /pm2 save/)
  assert.match(workflow, /EXPECTED_PM2_NAME='gaoge-api'/)
  assert.match(workflow, /FORBIDDEN_PM2_NAMES='gaoge-server'/)
  assert.match(workflow, /EXPECTED_DEPLOY_PATH='\$\{\{ secrets\.API_DEPLOY_PATH \}\}'/)
  assert.match(
    workflow,
    /EXPECTED_RELEASE_PATH='\$\{\{ secrets\.API_DEPLOY_PATH \}\}\/releases\/api\/\$\{\{ github\.sha \}\}'/,
  )
  assert.match(workflow, /EXPECTED_DB_HOST='\$\{\{ secrets\.EXPECTED_DATABASE_HOST \}\}'/)
  assert.match(workflow, /EXPECTED_DB_PORT='5432'/)
  assert.match(workflow, /EXPECTED_DB_NAME='gaoge_db'/)
  assert.match(workflow, /API_BASE_URL='https:\/\/api\.gaoge\.cc'/)
  assert.match(workflow, /CRITICAL_PATHS='\/health \/health\/db'/)
  assert.match(
    workflow,
    /NON_EMPTY_PATHS='\/football\/players\?page=1&pageSize=1 \/football\/teams\?page=1&pageSize=1 \/football\/match-rounds\?page=1&pageSize=1 \/football\/asset-records\?page=1&pageSize=1'/,
  )
  assert.match(workflow, /CORS_ORIGIN='https:\/\/admin\.gaoge\.cc'/)

  const runtimeGuardStep = workflow.indexOf('运行 API 运行时守卫')
  const firstPm2Save = workflow.indexOf('pm2 save')
  assert.notEqual(runtimeGuardStep, -1)
  assert.ok(firstPm2Save > runtimeGuardStep)
})

test('admin deployment verifies the API contract before switching frontend release', () => {
  const workflow = readWorkspaceFile('.github/workflows/deploy-admin.yml')

  assert.match(workflow, /group:\s+gaoge-production-deployment/)
  assert.match(workflow, /cancel-in-progress:\s+false/)
  assert.match(workflow, /ADMIN_API_CONTRACT_URLS/)
  assert.match(workflow, /校验 API 合约/)
  assert.match(workflow, /curl -fsS --retry 5 --retry-delay 3/)
  assert.match(
    workflow,
    /ln -sfn \$\{\{ secrets\.ADMIN_DEPLOY_PATH \}\}\/releases\/\$\{\{ github\.sha \}\} \$\{\{ secrets\.ADMIN_DEPLOY_PATH \}\}\/current/,
  )
})

test('api PM2 production runtime defaults to a single instance with override support', () => {
  const ecosystem = readWorkspaceFile('apps/api/ecosystem.config.cjs')

  assert.match(ecosystem, /parseInstances/)
  assert.match(ecosystem, /process\.env\.PM2_INSTANCES/)
  assert.match(ecosystem, /return 1/)
  assert.doesNotMatch(ecosystem, /instances:\s*'max'/)
})
