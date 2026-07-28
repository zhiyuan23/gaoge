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
  assert.match(guard, /DATABASE_URL/)
  assert.match(guard, /127\.0\.0\.1:5432/)
  assert.match(guard, /localhost:5432/)
  assert.match(guard, /readlink/)
  assert.match(guard, /pm2 jlist/)
  assert.match(guard, /CRITICAL_PATHS/)
  assert.match(guard, /curl -fsS/)
})

test('api deployment uploads and runs the gaoge runtime guard after PM2 save', () => {
  const workflow = readWorkspaceFile('.github/workflows/deploy-api.yml')

  assert.match(workflow, /group:\s+gaoge-production-deployment/)
  assert.match(workflow, /cancel-in-progress:\s+false/)
  assert.match(workflow, /echo Remote API migration started[\s\S]*date '\+%F %T %Z'/)
  assert.match(workflow, /echo Restarting gaoge-api with PM2[\s\S]*date '\+%F %T %Z'/)
  assert.match(workflow, /free -h \|\| true/)
  assert.match(workflow, /scripts\/deployment\/verify-remote-runtime\.sh/)
  assert.match(workflow, /pm2 save/)
  assert.match(workflow, /EXPECTED_PM2_NAME='gaoge-api'/)
  assert.match(workflow, /FORBIDDEN_PM2_NAMES='gaoge-server'/)
  assert.match(workflow, /EXPECTED_DEPLOY_PATH='\$\{\{ secrets\.API_DEPLOY_PATH \}\}'/)
  assert.match(
    workflow,
    /EXPECTED_RELEASE_PATH='\$\{\{ secrets\.API_DEPLOY_PATH \}\}\/releases\/api\/\$\{\{ github\.sha \}\}'/,
  )
  assert.match(workflow, /EXPECTED_DB_HOST='\$\{\{ secrets\.EXPECTED_DATABASE_HOST \}\}'/)
  assert.match(workflow, /API_BASE_URL='https:\/\/api\.gaoge\.cc'/)
  assert.match(
    workflow,
    /CRITICAL_PATHS='\/health \/health\/db \/football\/teams\?page=1&pageSize=1'/,
  )
  assert.match(workflow, /CORS_ORIGIN='https:\/\/admin\.gaoge\.cc'/)
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
