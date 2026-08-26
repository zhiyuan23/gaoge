import { BadRequestException, NotFoundException, ValidationPipe } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

import { verifyPassword } from '@/common/auth/password.util'

import { CreateSystemUserDto } from './dto/create-system-user.dto'
import { ResetSystemUserPasswordDto } from './dto/reset-system-user-password.dto'
import { SystemUserListDto } from './dto/system-user-list.dto'
import { UpdateSystemUserDto } from './dto/update-system-user.dto'
import { UpdateSystemUserStatusDto } from './dto/update-system-user-status.dto'
import { SystemUserService } from './system-user.service'

describe('SystemUserService', () => {
  const queryValidationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })

  const createService = () => {
    const prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: 2, status: 'active' }),
      },
      userRole: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      refreshToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn(async (input: ((tx: any) => Promise<unknown>) | Promise<unknown>[]) => {
        if (typeof input === 'function') {
          return input(prisma)
        }

        return Promise.all(input)
      }),
    }

    const audit = {
      record: jest.fn().mockResolvedValue(undefined),
    }
    const service = new SystemUserService(prisma as any, audit as any)

    return {
      prisma,
      audit,
      service,
    }
  }

  const transformListQuery = (query: Record<string, string | undefined>) =>
    queryValidationPipe.transform(query, {
      type: 'query',
      metatype: SystemUserListDto,
    })

  it('transforms valid list query params into typed dto values', async () => {
    await expect(
      transformListQuery({
        page: '2',
        pageSize: '30',
        keyword: ' admin ',
        roleId: '2',
        status: 'active',
      }),
    ).resolves.toEqual({
      page: 2,
      pageSize: 30,
      keyword: ' admin ',
      roleId: 2,
      status: 'active',
    })
  })

  it('rejects invalid roleId, status, page, and pageSize list query params', async () => {
    await expect(
      transformListQuery({
        page: '0',
        pageSize: '-1',
        roleId: '0',
        status: 'disabled',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('searches keyword against account and nickname while excluding deleted users', async () => {
    const { prisma, service } = createService()

    await service.findAll({ keyword: ' admin ' })

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          account: {
            not: null,
          },
          deletedAt: null,
          OR: [
            {
              account: {
                contains: 'admin',
                mode: 'insensitive',
              },
            },
            {
              nickname: {
                contains: 'admin',
                mode: 'insensitive',
              },
            },
          ],
        },
      }),
    )
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        account: {
          not: null,
        },
        deletedAt: null,
        OR: [
          {
            account: {
              contains: 'admin',
              mode: 'insensitive',
            },
          },
          {
            nickname: {
              contains: 'admin',
              mode: 'insensitive',
            },
          },
        ],
      },
    })
  })

  it('excludes rows without backend account in list queries', async () => {
    const { prisma, service } = createService()

    await service.findAll()

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          account: {
            not: null,
          },
          deletedAt: null,
        },
      }),
    )
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        account: {
          not: null,
        },
        deletedAt: null,
      },
    })
  })

  it('creates user with hashed password and trimmed account and nickname', async () => {
    const { prisma, service } = createService()
    prisma.user.findFirst.mockResolvedValue(null)
    prisma.role.findMany.mockResolvedValue([
      { id: 2, code: 'super_admin', name: '超级管理员', status: 'active' },
    ])
    prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 9,
      openid: null,
      unionid: null,
      phone: null,
      deletedAt: null,
      lastLoginAt: null,
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
      ...data,
      roles: [{ id: 2, code: 'super_admin', name: '超级管理员', status: 'active' }],
    }))

    const result = await service.create({
      account: '  manager  ',
      password: 'Admin@123456',
      nickname: '  Ops Lead  ',
      roleIds: [2],
      status: 'active',
    })

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        account: 'manager',
        deletedAt: null,
      },
    })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        account: 'manager',
        passwordHash: expect.any(String),
        nickname: 'Ops Lead',
        avatarUrl: undefined,
        role: 'admin',
        status: 'active',
      },
      select: {
        id: true,
        account: true,
        nickname: true,
        avatarUrl: true,
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                status: true,
              },
            },
          },
        },
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [{ userId: 9, roleId: 2 }],
      skipDuplicates: true,
    })
    expect(result).toMatchObject({
      id: 9,
      account: 'manager',
      nickname: 'Ops Lead',
      roles: [{ id: 2, code: 'super_admin', name: '超级管理员', status: 'active' }],
      status: 'active',
    })
    await expect(
      verifyPassword(
        'Admin@123456',
        (prisma.user.create.mock.calls[0]?.[0] as { data: { passwordHash: string } }).data
          .passwordHash,
      ),
    ).resolves.toBe(true)
  })

  it('rejects whitespace-only password when creating user', async () => {
    const { prisma, service } = createService()
    prisma.user.findFirst.mockResolvedValue(null)

    await expect(
      service.create({
        account: 'manager',
        password: '   ',
        nickname: 'Ops Lead',
        roleIds: [2],
        status: 'active',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)

    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('rejects soft-deleted users in single-record lookup flows', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      account: 'editor',
      nickname: 'Editor',
      roles: [],
      status: 'inactive',
      deletedAt: new Date('2026-05-06T00:00:00.000Z'),
    })

    await expect(service.remove(7)).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: expect.objectContaining({
        id: true,
        account: true,
        nickname: true,
        avatarUrl: true,
        userRoles: expect.any(Object),
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }),
    })
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('treats rows without backend account as missing in single-record operations', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 8,
      account: null,
      nickname: 'Miniapp User',
      roles: [],
      status: 'active',
      deletedAt: null,
    })

    await expect(service.update(8, { nickname: 'Ops', roleIds: [2] })).rejects.toBeInstanceOf(
      NotFoundException,
    )
    await expect(service.updateStatus(8, { status: 'inactive' })).rejects.toBeInstanceOf(
      NotFoundException,
    )
    await expect(service.resetPassword(8, { newPassword: 'Admin@123456' })).rejects.toBeInstanceOf(
      NotFoundException,
    )
    await expect(service.remove(8)).rejects.toBeInstanceOf(NotFoundException)

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects deleting the default admin account', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      account: 'admin',
      nickname: 'Administrator',
      roles: [{ id: 2, code: 'super_admin', name: '超级管理员', status: 'active' }],
      status: 'active',
      deletedAt: null,
    })

    await expect(service.remove(1)).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects disabling the default admin account', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      account: 'admin',
      nickname: 'Administrator',
      roles: [{ id: 2, code: 'super_admin', name: '超级管理员', status: 'active' }],
      status: 'active',
      deletedAt: null,
    })

    await expect(service.updateStatus(1, { status: 'inactive' })).rejects.toBeInstanceOf(
      BadRequestException,
    )
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects disabling the default admin account through compound update', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      account: 'admin',
      nickname: 'Administrator',
      roles: [{ id: 2, code: 'super_admin', name: '超级管理员', status: 'active' }],
      status: 'active',
      deletedAt: null,
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    })

    await expect(
      service.update(1, {
        nickname: 'Administrator',
        roleIds: [2],
        status: 'inactive',
        expectedUpdatedAt: '2026-05-06T00:00:00.000Z',
      }),
    ).rejects.toThrow('默认 admin 账号不允许停用')
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects demoting the default admin account', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      account: 'admin',
      nickname: 'Administrator',
      roles: [{ id: 2, code: 'super_admin', name: '超级管理员', status: 'active' }],
      status: 'active',
      deletedAt: null,
    })
    prisma.role.findMany.mockResolvedValue([
      { id: 3, code: 'system_viewer', name: '系统只读', status: 'active' },
    ])

    await expect(
      service.update(1, { nickname: 'Administrator', roleIds: [3] }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects removing the current account own super-admin recovery role', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      account: 'owner',
      nickname: 'Owner',
      avatarUrl: null,
      userRoles: [{ role: { id: 2, code: 'super_admin', name: '超级管理员', status: 'active' } }],
      status: 'active',
      deletedAt: null,
      lastLoginAt: null,
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    })

    await expect(
      service.updateStatus(
        7,
        { status: 'inactive', expectedUpdatedAt: '2026-05-06T00:00:00.000Z' },
        7,
      ),
    ).rejects.toThrow('当前账号不能移除自己的超级管理员资格')
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('keeps at least one active super-admin recovery account', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      account: 'owner',
      nickname: 'Owner',
      avatarUrl: null,
      userRoles: [{ role: { id: 2, code: 'super_admin', name: '超级管理员', status: 'active' } }],
      status: 'active',
      deletedAt: null,
      lastLoginAt: null,
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    })
    prisma.user.count.mockResolvedValue(1)

    await expect(
      service.updateStatus(
        7,
        { status: 'inactive', expectedUpdatedAt: '2026-05-06T00:00:00.000Z' },
        8,
      ),
    ).rejects.toThrow('系统必须保留至少一个有效超级管理员')
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rejects whitespace-only password when resetting password', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      account: 'editor',
      nickname: 'Editor',
      userRoles: [],
      status: 'active',
      deletedAt: null,
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    })

    await expect(service.resetPassword(7, { newPassword: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    )

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('soft deletes users by setting deletedAt and inactive status', async () => {
    const { prisma, service } = createService()
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      account: 'editor',
      nickname: 'Editor',
      userRoles: [],
      status: 'active',
      deletedAt: null,
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
    })
    prisma.user.update.mockResolvedValue({
      id: 7,
      account: 'editor',
      nickname: 'Editor',
      avatarUrl: null,
      lastLoginAt: null,
      createdAt: new Date('2026-05-06T00:00:00.000Z'),
      updatedAt: new Date('2026-05-06T00:00:00.000Z'),
      userRoles: [],
      status: 'inactive',
      deletedAt: new Date('2026-05-06T00:00:00.000Z'),
    })

    await service.remove(7)

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: expect.objectContaining({
        id: true,
        account: true,
        nickname: true,
        avatarUrl: true,
        userRoles: expect.any(Object),
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      }),
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        account: 'editor__deleted__7',
        status: 'inactive',
        deletedAt: expect.any(Date),
      },
      select: {
        id: true,
        account: true,
        nickname: true,
        avatarUrl: true,
        userRoles: expect.any(Object),
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  })

  it('requires the approved Task 2 fields in DTOs', async () => {
    const createErrors = await validate(
      plainToInstance(CreateSystemUserDto, {
        avatarUrl: 'https://example.com/avatar.png',
      }),
    )
    const updateErrors = await validate(
      plainToInstance(UpdateSystemUserDto, {
        avatarUrl: 'https://example.com/avatar.png',
      }),
    )
    const updateStatusErrors = await validate(plainToInstance(UpdateSystemUserStatusDto, {}))
    const resetPasswordErrors = await validate(plainToInstance(ResetSystemUserPasswordDto, {}))

    expect(createErrors.map((error) => error.property).sort()).toEqual([
      'account',
      'nickname',
      'password',
      'roleIds',
      'status',
    ])
    expect(updateErrors.map((error) => error.property).sort()).toEqual([
      'expectedUpdatedAt',
      'nickname',
      'roleIds',
    ])
    expect(updateStatusErrors.map((error) => error.property).sort()).toEqual([
      'expectedUpdatedAt',
      'status',
    ])
    expect(resetPasswordErrors.map((error) => error.property).sort()).toEqual([
      'expectedUpdatedAt',
      'newPassword',
    ])
  })
})
