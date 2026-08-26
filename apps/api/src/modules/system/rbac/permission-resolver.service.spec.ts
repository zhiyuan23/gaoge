import { PermissionResolverService } from './permission-resolver.service'

describe('PermissionResolverService', () => {
  it('grants an active super administrator every active resource permission, including custom ones', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          account: 'admin',
          openid: null,
          phone: null,
          role: 'admin',
          status: 'active',
          deletedAt: null,
          userRoles: [
            {
              role: {
                id: 1,
                code: 'super_admin',
                name: '超级管理员',
                status: 'active',
                rolePermissions: [],
              },
            },
          ],
        }),
      },
      permission: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 98,
            code: 'custom.report.view',
            action: 'view',
            status: 'active',
            resourceId: 9,
            resourceDefinition: { id: 9, status: 'active' },
          },
          {
            id: 99,
            code: 'custom.report.export',
            action: 'export',
            status: 'active',
            resourceId: 9,
            resourceDefinition: { id: 9, status: 'active' },
          },
        ]),
      },
    }

    const result = await new PermissionResolverService(prisma as any).resolve(1)

    expect(prisma.permission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'active', resourceDefinition: { status: 'active' } },
      }),
    )
    expect(result.permissions).toContain('custom.report.export')
  })
})
