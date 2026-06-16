import { BadRequestException } from '@nestjs/common'

import { BannerService, validateBannerJump } from './banner.service'

describe('BannerService', () => {
  const createService = () => {
    const prisma = {
      $transaction: jest.fn(),
      banner: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    }

    const service = new BannerService(prisma as any)

    return {
      prisma,
      service,
    }
  }

  it('returns only active banners for public miniapp usage sorted by sort desc then id desc', async () => {
    const { prisma, service } = createService()

    prisma.banner.findMany.mockResolvedValue([])

    await service.findPublished()

    expect(prisma.banner.findMany).toHaveBeenCalledWith({
      where: { status: 'active' },
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
    })
  })

  it('filters admin list by keyword status and jumpType', async () => {
    const { prisma, service } = createService()

    prisma.banner.findMany.mockResolvedValue([])

    await service.findAll({
      keyword: '训练营',
      status: 'active',
      jumpType: 'miniapp',
    })

    expect(prisma.banner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'active',
          jumpType: 'miniapp',
          title: {
            contains: '训练营',
            mode: 'insensitive',
          },
        },
      }),
    )
  })

  it('rejects create when title is blank after trim', async () => {
    const { prisma, service } = createService()

    await expect(
      service.create({
        title: '   ',
        imageUrl: 'https://cdn.example.com/banner.png',
      }),
    ).rejects.toThrow(new BadRequestException('轮播图标题不能为空'))

    expect(prisma.banner.create).not.toHaveBeenCalled()
  })

  it('stores null jumpUrl when jumpType is none', async () => {
    const { prisma, service } = createService()

    prisma.banner.create.mockResolvedValue({ id: 1 })

    await service.create({
      title: '纯展示',
      imageUrl: 'https://cdn.example.com/banner.png',
      jumpType: 'none',
      sort: 10,
      status: 'active',
    } as any)

    expect(prisma.banner.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        jumpType: 'none',
        jumpUrl: null,
      }),
    })
  })

  it('rejects invalid miniapp paths', async () => {
    await expect(
      validateBannerJump({
        jumpType: 'miniapp',
        jumpUrl: 'pages/home/index',
      }),
    ).rejects.toThrow('小程序页面路径必须以 /pages/ 开头')
  })

  it('rejects update when imageUrl is blank after trim', async () => {
    const { prisma, service } = createService()

    prisma.banner.findUnique.mockResolvedValue({
      id: 12,
      title: '夏训营',
      subtitle: null,
      imageUrl: 'https://cdn.example.com/banner.png',
      jumpType: 'none',
      jumpUrl: null,
      sort: 10,
      status: 'active',
    })

    await expect(
      service.update(12, {
        imageUrl: '   ',
      }),
    ).rejects.toThrow(new BadRequestException('轮播图图片不能为空'))

    expect(prisma.banner.update).not.toHaveBeenCalled()
  })

  it('rejects update when final effective jump state is invalid', async () => {
    const { prisma, service } = createService()

    prisma.banner.findUnique.mockResolvedValue({
      id: 12,
      title: '夏训营',
      subtitle: null,
      imageUrl: 'https://cdn.example.com/banner.png',
      jumpType: 'none',
      jumpUrl: null,
      sort: 10,
      status: 'active',
    })

    await expect(
      service.update(12, {
        jumpType: 'webview',
      }),
    ).rejects.toThrow(new BadRequestException('网页链接不能为空'))

    expect(prisma.banner.update).not.toHaveBeenCalled()
  })

  it('stores subtitle as trimmed text when creating banner', async () => {
    const { prisma, service } = createService()

    prisma.banner.create.mockResolvedValue({ id: 1 })

    await service.create({
      title: '纯展示',
      subtitle: '  可选说明  ',
      imageUrl: 'https://cdn.example.com/banner.png',
      jumpType: 'none',
      sort: 10,
      status: 'active',
    } as any)

    expect(prisma.banner.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtitle: '可选说明',
      }),
    })
  })

  it('stores null subtitle when creating banner with blank subtitle', async () => {
    const { prisma, service } = createService()

    prisma.banner.create.mockResolvedValue({ id: 1 })

    await service.create({
      title: '纯展示',
      subtitle: '   ',
      imageUrl: 'https://cdn.example.com/banner.png',
      jumpType: 'none',
      sort: 10,
      status: 'active',
    } as any)

    expect(prisma.banner.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtitle: null,
      }),
    })
  })

  it('updates subtitle when provided during banner update', async () => {
    const { prisma, service } = createService()

    prisma.banner.findUnique.mockResolvedValue({
      id: 12,
      title: '夏训营',
      subtitle: null,
      imageUrl: 'https://cdn.example.com/banner.png',
      jumpType: 'none',
      jumpUrl: null,
      sort: 10,
      status: 'active',
    })
    prisma.banner.update.mockResolvedValue({ id: 12 })

    await service.update(12, {
      subtitle: '  新副标题  ',
    })

    expect(prisma.banner.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: expect.objectContaining({
        subtitle: '新副标题',
      }),
    })
  })

  it('reorders banners in a transaction and returns sorted banners', async () => {
    const { prisma, service } = createService()
    const txFindMany = jest.fn().mockResolvedValue([{ id: 12 }, { id: 9 }, { id: 3 }])
    const txUpdate = jest.fn().mockResolvedValue(undefined)

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        banner: {
          findMany: txFindMany,
          update: txUpdate,
        },
      }),
    )
    prisma.banner.findMany.mockResolvedValue([
      { id: 12, sort: 300 },
      { id: 9, sort: 200 },
      { id: 3, sort: 100 },
    ])

    const result = await service.reorder({
      items: [
        { id: 12, sort: 300 },
        { id: 9, sort: 200 },
        { id: 3, sort: 100 },
      ],
    })

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(txFindMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [12, 9, 3],
        },
      },
      select: {
        id: true,
      },
    })
    expect(txUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 12 },
      data: { sort: 300 },
    })
    expect(txUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 9 },
      data: { sort: 200 },
    })
    expect(txUpdate).toHaveBeenNthCalledWith(3, {
      where: { id: 3 },
      data: { sort: 100 },
    })
    expect(prisma.banner.findMany).toHaveBeenCalledWith({
      orderBy: [{ sort: 'desc' }, { id: 'desc' }],
    })
    expect(result).toEqual([
      { id: 12, sort: 300 },
      { id: 9, sort: 200 },
      { id: 3, sort: 100 },
    ])
  })

  it('rejects reorder when some banner ids do not exist', async () => {
    const { prisma, service } = createService()

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        banner: {
          findMany: jest.fn().mockResolvedValue([{ id: 12 }]),
          update: jest.fn(),
        },
      }),
    )

    await expect(
      service.reorder({
        items: [
          { id: 12, sort: 200 },
          { id: 99, sort: 100 },
        ],
      }),
    ).rejects.toThrow(new BadRequestException('部分 Banner 不存在，无法排序'))
  })
})
