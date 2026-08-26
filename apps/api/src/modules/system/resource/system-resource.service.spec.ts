import { ConflictException } from '@nestjs/common'

import { SystemResourceService } from './system-resource.service'

describe('SystemResourceService', () => {
  const now = new Date('2026-08-26T00:00:00.000Z')

  const createService = () => {
    const prisma = {
      resource: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      permission: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      menuResource: { count: jest.fn().mockResolvedValue(0) },
      rolePermission: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
    }
    const audit = { record: jest.fn().mockResolvedValue(undefined) }
    return {
      prisma,
      audit,
      service: new SystemResourceService(prisma as any, audit as any),
    }
  }

  it('creates the resource and its unique view permission in one transaction', async () => {
    const { prisma, service, audit } = createService()
    const resource = {
      id: 9,
      key: 'custom.report',
      name: '报表',
      module: 'custom',
      description: null,
      status: 'active',
      sort: 0,
      isBuiltIn: false,
      permissions: [],
      menuResources: [],
      createdAt: now,
      updatedAt: now,
    }
    prisma.resource.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(resource)
    prisma.resource.create.mockResolvedValue(resource)
    prisma.permission.create.mockResolvedValue({ id: 90 })

    await expect(
      service.create({ key: 'custom.report', name: '报表', module: 'custom' }, 1),
    ).resolves.toMatchObject({ id: 9, key: 'custom.report' })
    expect(prisma.permission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: 'custom.report.view',
        module: 'custom',
        resource: 'report',
        action: 'view',
        resourceId: 9,
      }),
    })
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SYSTEM_RESOURCE_CREATED', actorUserId: 1 }),
      prisma,
    )
  })

  it('refuses deletion while a resource is referenced by menus or role permissions', async () => {
    const { prisma, service } = createService()
    prisma.resource.findUnique.mockResolvedValue({ id: 9, key: 'custom.report', isBuiltIn: false })
    prisma.menuResource.count.mockResolvedValue(1)
    prisma.rolePermission.count.mockResolvedValue(2)

    await expect(service.remove(9)).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.resource.delete).not.toHaveBeenCalled()
  })
})
