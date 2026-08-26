import { SystemMenuController } from './system-menu.controller'
import { SystemMenuConfigurationService } from './system-menu-configuration.service'

describe('SystemMenuController built-in ownership', () => {
  const now = new Date('2026-08-26T00:00:00.000Z')
  const builtIn = {
    id: 30,
    parentId: null,
    name: 'sports',
    title: '高歌体育',
    icon: null,
    path: null,
    routeName: 'sports',
    menuType: 'group',
    sort: 0,
    status: 'active',
    visible: true,
    isBuiltIn: true,
    createdAt: now,
    updatedAt: now,
    menuResources: [],
    menuPermissions: [],
  }

  const createController = () => {
    const prisma = {
      menu: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
    }
    const configuration = new SystemMenuConfigurationService(
      prisma as any,
      {
        record: jest.fn(),
      } as any,
    )
    return {
      configuration,
      controller: new SystemMenuController({} as any, configuration),
      prisma,
    }
  }

  const payload = {
    parentId: null,
    name: 'sports',
    title: '高歌体育',
    path: null,
    routeName: 'sports',
    menuType: 'group' as const,
    sort: 0,
    status: 'active' as const,
    visible: true,
    resourceIds: [],
    expectedUpdatedAt: now.toISOString(),
  }

  it('propagates direct structural bypass rejection from the configuration boundary', async () => {
    const { controller, prisma } = createController()
    prisma.menu.findUnique.mockResolvedValue(builtIn)

    await expect(
      controller.update(30, { ...payload, routeName: 'renamedSports' }, { user: { id: 1 } }),
    ).rejects.toThrow('内置菜单的结构和资源关联由系统配置维护')
    expect(prisma.menu.update).not.toHaveBeenCalled()
  })

  it('allows presentation-only edits through the controller', async () => {
    const { controller, prisma } = createController()
    const updated = { ...builtIn, title: '定制体育', icon: 'custom:sports', sort: 20 }
    prisma.menu.findUnique.mockResolvedValueOnce(builtIn).mockResolvedValueOnce(updated)
    prisma.menu.update.mockResolvedValue(updated)

    const result = await controller.update(
      30,
      { ...payload, title: '定制体育', icon: 'custom:sports', sort: 20 },
      { user: { id: 1 } },
    )

    expect(result.title).toBe('定制体育')
    expect(prisma.menu.update).toHaveBeenCalledWith({
      where: { id: 30 },
      data: {
        title: '定制体育',
        icon: 'custom:sports',
        sort: 20,
        status: 'active',
        visible: true,
      },
    })
  })
})
