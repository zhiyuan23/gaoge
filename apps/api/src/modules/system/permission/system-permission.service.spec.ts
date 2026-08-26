import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'

import { SystemPermissionService } from './system-permission.service'

describe('SystemPermissionService', () => {
  const now = new Date('2026-05-20T00:00:00.000Z')

  const createService = () => {
    const prisma = {
      permission: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      resource: {
        findUnique: jest.fn(),
      },
      rolePermission: {
        count: jest.fn().mockResolvedValue(0),
      },
      menuPermission: {
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback(prisma)),
    }
    const rbacSyncService = {
      syncBuiltIns: jest.fn(),
    }

    const audit = {
      record: jest.fn().mockResolvedValue(undefined),
    }

    return {
      prisma,
      audit,
      rbacSyncService,
      service: new SystemPermissionService(prisma as any, rbacSyncService as any, audit as any),
    }
  }

  it('creates a custom permission by parsing module, resource, and action from code', async () => {
    const { prisma, service } = createService()
    prisma.permission.findUnique.mockResolvedValue(null)
    prisma.resource.findUnique.mockResolvedValue({
      id: 7,
      key: 'system.audit',
      name: '审计日志',
      status: 'active',
    })
    prisma.permission.create.mockImplementation(async ({ data }: any) => ({
      id: 12,
      createdAt: now,
      updatedAt: now,
      resourceDefinition: {
        id: 7,
        key: 'system.audit',
        name: '审计日志',
        status: 'active',
      },
      ...data,
    }))

    const result = await service.create({
      code: 'system.audit.view',
      name: '审计日志查看',
      description: '查看审计日志',
      status: 'active',
    })

    expect(prisma.permission.create).toHaveBeenCalledWith({
      data: {
        code: 'system.audit.view',
        name: '审计日志查看',
        module: 'system',
        resource: 'audit',
        action: 'view',
        resourceId: 7,
        description: '查看审计日志',
        status: 'active',
        isBuiltIn: false,
      },
      include: { resourceDefinition: true },
    })
    expect(result).toMatchObject({
      id: 12,
      code: 'system.audit.view',
      module: 'system',
      resource: 'audit',
      action: 'view',
      isBuiltIn: false,
    })
  })

  it('rejects duplicate permission code when creating custom permissions', async () => {
    const { prisma, service } = createService()
    prisma.permission.findUnique.mockResolvedValue({ id: 1, code: 'system.audit.view' })

    await expect(
      service.create({
        code: 'system.audit.view',
        name: '审计日志查看',
        status: 'active',
      }),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.permission.create).not.toHaveBeenCalled()
  })

  it('rejects permission codes that are not three-part module.resource.action values', async () => {
    const { prisma, service } = createService()

    await expect(
      service.create({
        code: 'system.audit',
        name: '审计日志查看',
        status: 'active',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      service.create({
        code: 'System.audit.view',
        name: '审计日志查看',
        status: 'active',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.permission.findUnique).not.toHaveBeenCalled()
  })

  it('updates metadata for built-in and custom permissions without changing code fields', async () => {
    const { prisma, service } = createService()
    prisma.permission.findUnique.mockResolvedValue({
      id: 3,
      code: 'system.audit.view',
      isBuiltIn: false,
      updatedAt: now,
    })
    prisma.permission.update.mockResolvedValue({
      id: 3,
      code: 'system.audit.view',
      name: '审计查看',
      module: 'system',
      resource: 'audit',
      action: 'view',
      description: null,
      status: 'inactive',
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      resourceId: 7,
      resourceDefinition: {
        id: 7,
        key: 'system.audit',
        name: '审计日志',
        status: 'active',
      },
    })

    await service.update(3, {
      name: '审计查看',
      status: 'inactive',
      expectedUpdatedAt: now.toISOString(),
    })

    expect(prisma.permission.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        name: '审计查看',
        description: undefined,
        status: 'inactive',
      },
      include: { resourceDefinition: true },
    })
  })

  it('deletes unreferenced custom permissions', async () => {
    const { prisma, service } = createService()
    prisma.permission.findUnique.mockResolvedValue({
      id: 5,
      code: 'system.audit.view',
      isBuiltIn: false,
    })
    prisma.permission.delete.mockResolvedValue({ id: 5 })

    await expect(service.remove(5)).resolves.toEqual({ id: 5 })
    expect(prisma.permission.delete).toHaveBeenCalledWith({ where: { id: 5 } })
  })

  it('blocks deleting built-in, missing, role-bound, and menu-bound permissions', async () => {
    const { prisma, service } = createService()

    prisma.permission.findUnique.mockResolvedValueOnce(null)
    await expect(service.remove(404)).rejects.toBeInstanceOf(NotFoundException)

    prisma.permission.findUnique.mockResolvedValueOnce({ id: 1, isBuiltIn: true })
    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException)

    prisma.permission.findUnique.mockResolvedValueOnce({ id: 2, isBuiltIn: false })
    prisma.rolePermission.count.mockResolvedValueOnce(1)
    await expect(service.remove(2)).rejects.toBeInstanceOf(BadRequestException)

    prisma.permission.findUnique.mockResolvedValueOnce({ id: 3, isBuiltIn: false })
    prisma.rolePermission.count.mockResolvedValueOnce(0)
    prisma.menuPermission.count.mockResolvedValueOnce(1)
    await expect(service.remove(3)).rejects.toBeInstanceOf(BadRequestException)

    prisma.permission.findUnique.mockResolvedValueOnce({
      id: 4,
      isBuiltIn: false,
      action: 'view',
    })
    await expect(service.remove(4)).rejects.toBeInstanceOf(BadRequestException)

    expect(prisma.permission.delete).not.toHaveBeenCalled()
  })
})
