import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveIconSource } from '../src/ui/components/FaIcon/resolve.ts'

test('normalizes UnoCSS-style names to the existing Iconify renderer', () => {
  assert.deepEqual(resolveIconSource('i-ri:edit-line'), {
    name: 'ri:edit-line',
    outputType: 'iconify',
  })
  assert.deepEqual(resolveIconSource('ri:settings-3-line'), {
    name: 'ri:settings-3-line',
    outputType: 'iconify',
  })
})

test('preserves image paths and local SVG sprite names', () => {
  assert.deepEqual(resolveIconSource('/icons/team.svg'), {
    name: '/icons/team.svg',
    outputType: 'img',
  })
  assert.deepEqual(resolveIconSource('example-crown'), {
    name: 'example-crown',
    outputType: 'svg',
  })
})
