import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildTurboArgs,
  createExecutionPlan,
  formatModeMessage,
  isSupportedTarget,
  probeApiHealth,
  resolvePnpmCommand,
} from './dev-with-api.mjs'

test('isSupportedTarget returns true for admin, desktop, web and miniapp', () => {
  assert.equal(isSupportedTarget('admin'), true)
  assert.equal(isSupportedTarget('desktop'), true)
  assert.equal(isSupportedTarget('web'), true)
  assert.equal(isSupportedTarget('miniapp'), true)
  assert.equal(isSupportedTarget('api'), false)
})

test('buildTurboArgs omits api filter when api is already running', () => {
  assert.deepEqual(buildTurboArgs('web', true), ['turbo', 'run', 'dev', '--filter=@gaoge/app-web'])
  assert.deepEqual(buildTurboArgs('desktop', true), [
    'turbo',
    'run',
    'dev',
    '--filter=@gaoge/app-desktop',
  ])
})

test('buildTurboArgs includes api filter and parallel flag when api is not running', () => {
  assert.deepEqual(buildTurboArgs('miniapp', false), [
    'turbo',
    'run',
    'dev',
    '--parallel',
    '--filter=@gaoge/app-miniapp',
    '--filter=@gaoge/app-api',
  ])
})

test('createExecutionPlan throws on unsupported target', async () => {
  await assert.rejects(() => createExecutionPlan('foo', async () => true), {
    message: /Unsupported target/,
  })
})

test('createExecutionPlan returns target-only mode when api probe succeeds', async () => {
  const plan = await createExecutionPlan('admin', async () => true)

  assert.equal(plan.includeApi, false)
  assert.equal(plan.targetFilter, '@gaoge/app-admin')
})

test('createExecutionPlan returns target-plus-api mode when api probe fails', async () => {
  const plan = await createExecutionPlan('admin', async () => false)

  assert.equal(plan.includeApi, true)
  assert.equal(plan.args.includes('--parallel'), true)
  assert.equal(plan.args.includes('--filter=@gaoge/app-api'), true)
})

test('probeApiHealth returns true on 2xx response', async () => {
  const ok = await probeApiHealth(async () => ({ ok: true }))

  assert.equal(ok, true)
})

test('probeApiHealth returns false when fetch throws', async () => {
  const ok = await probeApiHealth(async () => {
    throw new Error('connect ECONNREFUSED')
  })

  assert.equal(ok, false)
})

test('resolvePnpmCommand prefers npm_execpath when available', () => {
  const resolved = resolvePnpmCommand('/opt/homebrew/bin/node', '/tmp/pnpm.cjs')

  assert.deepEqual(resolved, {
    command: '/opt/homebrew/bin/node',
    args: ['/tmp/pnpm.cjs'],
  })
})

test('resolvePnpmCommand falls back to pnpm when npm_execpath is missing', () => {
  const resolved = resolvePnpmCommand('/opt/homebrew/bin/node', undefined)

  assert.deepEqual(resolved, {
    command: 'pnpm',
    args: [],
  })
})

test('formatModeMessage describes target-only mode', () => {
  assert.equal(formatModeMessage('web', false), 'API is running, starting web only')
})

test('formatModeMessage describes api-plus-target mode', () => {
  assert.equal(formatModeMessage('admin', true), 'API is not running, starting api + admin')
})
