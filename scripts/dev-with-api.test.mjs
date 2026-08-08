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

test('isSupportedTarget returns true for admin, desktop, miniapp, sports and uniapp', () => {
  assert.equal(isSupportedTarget('admin'), true)
  assert.equal(isSupportedTarget('desktop'), true)
  assert.equal(isSupportedTarget('miniapp'), true)
  assert.equal(isSupportedTarget('sports'), true)
  assert.equal(isSupportedTarget('uniapp'), true)
  assert.equal(isSupportedTarget('api'), false)
  assert.equal(isSupportedTarget('web'), false)
})

test('buildTurboArgs omits api filter when api is already running', () => {
  assert.deepEqual(buildTurboArgs('sports', true), [
    'turbo',
    'run',
    'dev',
    '--filter=@gaoge/app-sports',
  ])
  assert.deepEqual(buildTurboArgs('desktop', true), [
    'turbo',
    'run',
    'dev',
    '--filter=@gaoge/app-desktop',
  ])
})

test('buildTurboArgs includes api filter and parallel flag when api is not running', () => {
  assert.deepEqual(buildTurboArgs('uniapp', false), [
    'turbo',
    'run',
    'dev',
    '--parallel',
    '--filter=@gaoge/app-uniapp',
    '--filter=@gaoge/app-api',
  ])
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

test('probeApiHealth returns true when health payload matches this api', async () => {
  const ok = await probeApiHealth(async () => ({
    ok: true,
    json: async () => ({
      code: 0,
      data: {
        app: '@gaoge/core-api',
        status: 'ok',
      },
    }),
  }))

  assert.equal(ok, true)
})

test('probeApiHealth returns false when another app responds on the api port', async () => {
  const ok = await probeApiHealth(async () => ({
    ok: true,
    json: async () => ({
      code: 0,
      data: {
        app: '@gaoge/compass-api',
        status: 'ok',
      },
    }),
  }))

  assert.equal(ok, false)
})

test('probeApiHealth returns false when health payload has no app identity', async () => {
  const ok = await probeApiHealth(async () => ({
    ok: true,
    json: async () => ({
      code: 0,
      data: {
        status: 'ok',
      },
    }),
  }))

  assert.equal(ok, false)
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
  assert.equal(formatModeMessage('sports', false), 'API is running, starting sports only')
})

test('formatModeMessage describes api-plus-target mode', () => {
  assert.equal(formatModeMessage('admin', true), 'API is not running, starting api + admin')
})
