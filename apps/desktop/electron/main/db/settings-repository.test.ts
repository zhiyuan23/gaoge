import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'

import { createSettingsRepository } from './settings-repository'

const tempRoots: string[] = []

afterEach(() => {
  for (const tempRoot of tempRoots) {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})

test('createSettingsRepository persists and reads values', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gaoge-electron-'))
  tempRoots.push(tempRoot)

  const repository = createSettingsRepository(path.join(tempRoot, 'settings.db'))

  repository.set('theme', 'emerald')

  expect(repository.get('theme')).toBe('emerald')
  expect(repository.get('missing')).toBeNull()
})
