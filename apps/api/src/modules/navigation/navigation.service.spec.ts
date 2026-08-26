import { NavigationService } from './navigation.service'

describe('NavigationService', () => {
  const createNavigationService = (permissions: string[], menus: unknown[]) => {
    const prisma = {
      menu: {
        findMany: jest.fn().mockResolvedValue(menus),
      },
    }
    const resolver = {
      resolve: jest.fn().mockResolvedValue({ permissions, roles: [] }),
    }

    return {
      prisma,
      resolver,
      service: new NavigationService(prisma as any, resolver as any),
    }
  }

  const createService = (permissions: string[]) => {
    return createNavigationService(permissions, [
      {
        id: 1,
        parentId: null,
        title: '系统管理',
        icon: 'settings',
        path: '/system',
        routeName: 'system',
        menuType: 'catalog',
        sort: 0,
        menuResources: [],
      },
      {
        id: 2,
        parentId: 1,
        title: '复合页面',
        icon: null,
        path: '/system/composite',
        routeName: 'systemComposite',
        menuType: 'menu',
        sort: 0,
        menuResources: [
          {
            resource: {
              status: 'active',
              permissions: [{ code: 'system.user.view' }],
            },
          },
          {
            resource: {
              status: 'active',
              permissions: [{ code: 'system.role.view' }],
            },
          },
        ],
      },
      {
        id: 3,
        parentId: null,
        title: '空目录',
        icon: null,
        path: '/empty',
        routeName: 'empty',
        menuType: 'catalog',
        sort: 10,
        menuResources: [],
      },
    ]).service
  }

  it('uses ANY semantics for page resources and removes empty directories', async () => {
    const result = await createService(['system.role.view']).getVisibleMenus(7)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      path: '/system',
      children: [{ path: '/system/composite' }],
    })
  })

  it('hides a resource-bound page when no associated view permission is effective', async () => {
    await expect(createService([]).getVisibleMenus(7)).resolves.toEqual([])
  })

  it('queries only active visible menus and effective view permissions', async () => {
    const { prisma, service } = createNavigationService([], [])

    await service.getVisibleMenus(7)

    expect(prisma.menu.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'active', visible: true },
        select: expect.objectContaining({
          menuResources: expect.objectContaining({
            select: {
              resource: {
                select: {
                  status: true,
                  permissions: {
                    where: { action: 'view', status: 'active' },
                    select: { code: true },
                  },
                },
              },
            },
          }),
        }),
      }),
    )
  })

  it('hides a page when its matching permission belongs only to an inactive resource', async () => {
    const { service } = createNavigationService(
      ['system.user.view'],
      [
        {
          id: 1,
          parentId: null,
          title: '系统管理',
          icon: null,
          path: '/system',
          routeName: 'system',
          menuType: 'catalog',
          sort: 0,
          menuResources: [],
        },
        {
          id: 2,
          parentId: 1,
          title: '用户管理',
          icon: null,
          path: '/system/users',
          routeName: 'systemUser',
          menuType: 'menu',
          sort: 0,
          menuResources: [
            {
              resource: {
                status: 'inactive',
                permissions: [{ code: 'system.user.view' }],
              },
            },
          ],
        },
      ],
    )

    await expect(service.getVisibleMenus(7)).resolves.toEqual([])
  })

  it('orders equal-sort siblings by id even when database input is reversed', async () => {
    const { service } = createNavigationService(
      [],
      [
        {
          id: 1,
          parentId: null,
          title: '系统管理',
          icon: null,
          path: '/system',
          routeName: 'system',
          menuType: 'catalog',
          sort: 0,
          menuResources: [],
        },
        {
          id: 20,
          parentId: 1,
          title: '角色管理',
          icon: null,
          path: '/system/roles',
          routeName: 'systemRole',
          menuType: 'menu',
          sort: 0,
          menuResources: [],
        },
        {
          id: 10,
          parentId: 1,
          title: '用户管理',
          icon: null,
          path: '/system/users',
          routeName: 'systemUser',
          menuType: 'menu',
          sort: 0,
          menuResources: [],
        },
      ],
    )

    const result = await service.getVisibleMenus(7)

    expect(result[0].children.map((node) => node.routeName)).toEqual(['systemUser', 'systemRole'])
  })

  it('sorts the authorized navigation tree and prunes empty groups and catalogs', async () => {
    const prisma = {
      menu: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 2,
            parentId: null,
            title: '系统管理',
            icon: 'settings',
            path: null,
            routeName: 'systemManagement',
            menuType: 'group',
            sort: 10,
            menuResources: [],
          },
          {
            id: 4,
            parentId: 2,
            title: '微信管理',
            icon: null,
            path: '/wechat',
            routeName: 'wechat',
            menuType: 'catalog',
            sort: 10,
            menuResources: [],
          },
          {
            id: 40,
            parentId: 4,
            title: '分享配置',
            icon: null,
            path: '/wechat/share',
            routeName: 'wechatShare',
            menuType: 'menu',
            sort: 0,
            menuResources: [],
          },
          {
            id: 1,
            parentId: null,
            title: '高歌体育',
            icon: 'football',
            path: null,
            routeName: 'sports',
            menuType: 'group',
            sort: 0,
            menuResources: [],
          },
          {
            id: 3,
            parentId: 2,
            title: '系统',
            icon: null,
            path: '/system',
            routeName: 'system',
            menuType: 'catalog',
            sort: 0,
            menuResources: [],
          },
          {
            id: 30,
            parentId: 3,
            title: '用户管理',
            icon: null,
            path: '/system/user',
            routeName: 'systemUser',
            menuType: 'menu',
            sort: 0,
            menuResources: [],
          },
          {
            id: 10,
            parentId: 1,
            title: '赛事',
            icon: null,
            path: '/sports',
            routeName: 'sportsFootball',
            menuType: 'catalog',
            sort: 0,
            menuResources: [],
          },
          {
            id: 100,
            parentId: 10,
            title: '球员',
            icon: null,
            path: '/sports/players',
            routeName: 'player',
            menuType: 'menu',
            sort: 0,
            menuResources: [],
          },
          {
            id: 5,
            parentId: null,
            title: '空分组',
            icon: null,
            path: null,
            routeName: 'emptyGroup',
            menuType: 'group',
            sort: 20,
            menuResources: [],
          },
          {
            id: 50,
            parentId: 5,
            title: '空目录',
            icon: null,
            path: '/empty',
            routeName: 'emptyCatalog',
            menuType: 'catalog',
            sort: 0,
            menuResources: [],
          },
          {
            id: 500,
            parentId: 50,
            title: '受限页面',
            icon: null,
            path: '/empty/hidden',
            routeName: 'hiddenPage',
            menuType: 'menu',
            sort: 0,
            menuResources: [
              {
                resource: {
                  status: 'active',
                  permissions: [{ code: 'system.hidden.view' }],
                },
              },
            ],
          },
        ]),
      },
    }
    const resolver = {
      resolve: jest.fn().mockResolvedValue({ permissions: [], roles: [] }),
    }

    const result = await new NavigationService(prisma as any, resolver as any).getVisibleMenus(7)

    expect(result.map((node) => node.routeName)).toEqual(['sports', 'systemManagement'])
    expect(result[1]).toMatchObject({
      type: 'group',
      path: null,
      children: [
        { routeName: 'system', type: 'catalog' },
        { routeName: 'wechat', type: 'catalog' },
      ],
    })
    expect(result[0]).toMatchObject({
      name: 'sports',
      meta: { title: '高歌体育', icon: 'football' },
    })
  })
})
