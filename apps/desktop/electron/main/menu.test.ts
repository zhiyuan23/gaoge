import { describe, expect, it } from 'vitest'

import { APP_DISPLAY_NAME, buildAppMenuTemplate } from './menu'

describe('buildAppMenuTemplate', () => {
  it('builds a localized macOS menu template', () => {
    const template = buildAppMenuTemplate()

    expect(template[0]).toMatchObject({
      label: APP_DISPLAY_NAME,
      submenu: expect.arrayContaining([
        expect.objectContaining({ label: `关于${APP_DISPLAY_NAME}` }),
        expect.objectContaining({ label: `退出${APP_DISPLAY_NAME}` }),
      ]),
    })

    expect(template).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '编辑' }),
        expect.objectContaining({ label: '视图' }),
        expect.objectContaining({ label: '窗口' }),
        expect.objectContaining({ label: '帮助' }),
      ]),
    )
  })
})
