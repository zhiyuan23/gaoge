import { describe, expect, it, vi } from 'vitest'

import { createElectronBridge } from './electron'

describe('createElectronBridge', () => {
  it('returns safe fallbacks when preload bridge is missing', async () => {
    const bridge = createElectronBridge({})

    await expect(bridge.app.getVersion()).resolves.toBe('0.0.0-dev')
    await expect(bridge.shell.openExternal('https://gaoge.app')).resolves.toBe(false)
  })

  it('delegates to window.gaoge when preload bridge is present', async () => {
    const gaoge = {
      app: {
        getVersion: vi.fn().mockResolvedValue('1.2.3'),
      },
      shell: {
        openExternal: vi.fn().mockResolvedValue(true),
      },
    }

    const bridge = createElectronBridge({ gaoge })

    await expect(bridge.app.getVersion()).resolves.toBe('1.2.3')
    await expect(bridge.shell.openExternal('https://gaoge.app')).resolves.toBe(true)
  })
})
