import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const originalProcess = globalThis.process
const utilsSource = readFileSync(path.resolve(import.meta.dirname, '../src/utils/index.ts'), 'utf8')

try {
  Reflect.set(globalThis, 'process', undefined)

  const { resolveRoutePath } = await import('../src/utils/index.ts')

  assert(!utilsSource.includes('path-browserify'), 'resolveRoutePath 仍然依赖 path-browserify')
  assert.doesNotThrow(() => resolveRoutePath('/sports/football', 'player'))
  assert.equal(resolveRoutePath('/sports/football', 'player'), '/sports/football/player')
  assert.equal(resolveRoutePath('/sports', '/sports/content'), '/sports/content')
} finally {
  Reflect.set(globalThis, 'process', originalProcess)
}

console.log('resolve route path check passed')
