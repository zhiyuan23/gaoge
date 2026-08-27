import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const declaration = readFileSync(
  new URL('../admin-page-route-names.d.cts', import.meta.url),
  'utf8',
)
const esmSource = readFileSync(new URL('../src/admin-page-route-names.ts', import.meta.url), 'utf8')
const runtimeRouteNames = require('../admin-page-route-names.cjs').ADMIN_PAGE_ROUTE_NAMES

const declarationRouteNames = [...declaration.matchAll(/'([^']+)'/g)].map((match) => match[1])
const esmRouteNames = [...esmSource.matchAll(/'([^']+)'/g)].map((match) => match[1])

test('cjs, esm, and declaration route-name literals are identical and ordered', () => {
  assert.deepEqual([...runtimeRouteNames], declarationRouteNames)
  assert.deepEqual(esmRouteNames, declarationRouteNames)
})

test('esm consumers receive an esm route-name registry', () => {
  assert.equal(
    packageJson.exports['./admin-page-route-names'].import,
    './src/admin-page-route-names.ts',
  )
})

test('shared-types typecheck always runs the route-name parity gate', () => {
  assert.match(
    packageJson.scripts.typecheck,
    /node --test tests\/admin-page-route-names-contract\.test\.mjs/,
  )
})
