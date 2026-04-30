import { NotFoundException } from '@nestjs/common'

import { TeamsService } from './teams.service'

describe('TeamsService', () => {
  const createService = () => {
    const prisma = {
      team: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((actions: Promise<unknown>[]) => Promise.all(actions)),
    }

    const service = new TeamsService(prisma as any)

    return {
      prisma,
      service,
    }
  }

  it('returns paged list and total with keyword filtering and stable ordering', async () => {
    const { prisma, service } = createService()
    prisma.team.findMany.mockResolvedValue([{ id: 2 }, { id: 3 }])
    prisma.team.count.mockResolvedValue(12)

    await expect(service.findAll({ keyword: '皇家', page: 2, pageSize: 2 })).resolves.toEqual({
      list: [{ id: 2 }, { id: 3 }],
      total: 12,
    })

    expect(prisma.team.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: '皇家',
          mode: 'insensitive',
        },
      },
      skip: 2,
      take: 2,
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    })
    expect(prisma.team.count).toHaveBeenCalledWith({
      where: {
        name: {
          contains: '皇家',
          mode: 'insensitive',
        },
      },
    })
  })

  it('accepts pagination from query string values', async () => {
    const { prisma, service } = createService()

    await service.findAll({ page: '3', pageSize: '5' } as any)

    expect(prisma.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 5,
      }),
    )
  })

  it('falls back to default pagination for invalid values', async () => {
    const { prisma, service } = createService()

    await service.findAll({ page: '0', pageSize: '-2' } as any)

    expect(prisma.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 15,
      }),
    )
  })

  it('creates a team with an auto generated code', async () => {
    const { prisma, service } = createService()
    prisma.team.create.mockResolvedValue({ id: 1 })

    await service.create({
      name: '皇家高歌',
      slogan: '向前',
      sponsorName: null,
      sort: 1,
    })

    expect(prisma.team.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: '皇家高歌',
        slogan: '向前',
        sponsorName: null,
        sort: 1,
        code: expect.stringMatching(/^team_[a-z0-9]+_[0-9a-f]+$/),
      }),
    })
  })

  it('normalizes blank optional text fields to null on create', async () => {
    const { prisma, service } = createService()

    await service.create({
      name: '皇家高歌',
      slogan: '   ',
      sponsorName: '',
      sort: 1,
    })

    expect(prisma.team.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slogan: null,
        sponsorName: null,
      }),
    })
  })

  it('throws when the team does not exist', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue(null)

    await expect(service.findOne(404)).rejects.toThrow(new NotFoundException('球队不存在'))
  })

  it('returns the team when it exists', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue({ id: 3, name: '皇家高歌' })

    await expect(service.findOne(3)).resolves.toEqual({ id: 3, name: '皇家高歌' })
  })

  it('checks existence before update', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue(null)

    await expect(service.update(7, { name: '新队名' })).rejects.toThrow('球队不存在')

    expect(prisma.team.update).not.toHaveBeenCalled()
  })

  it('updates the team after existence check and normalizes blank optional text fields', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue({ id: 7, name: '旧队名' })
    prisma.team.update.mockResolvedValue({ id: 7, slogan: null, sponsorName: null })

    await expect(
      service.update(7, {
        slogan: ' ',
        sponsorName: '',
      }),
    ).resolves.toEqual({ id: 7, slogan: null, sponsorName: null })

    expect(prisma.team.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        slogan: null,
        sponsorName: null,
      },
    })
  })

  it('keeps undefined nullable fields untouched on update', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue({ id: 8, name: '旧队名', slogan: '保留口号' })
    prisma.team.update.mockResolvedValue({ id: 8, name: '新队名', slogan: '保留口号' })

    await expect(
      service.update(8, {
        name: '新队名',
        slogan: undefined,
        sponsorName: undefined,
      }),
    ).resolves.toEqual({ id: 8, name: '新队名', slogan: '保留口号' })

    expect(prisma.team.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: {
        name: '新队名',
      },
    })
  })

  it('treats explicit null as clearing nullable fields on update', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue({ id: 10, name: '旧队名' })
    prisma.team.update.mockResolvedValue({ id: 10, slogan: null, sponsorName: null })

    await expect(
      service.update(10, {
        slogan: null,
        sponsorName: null,
      }),
    ).resolves.toEqual({ id: 10, slogan: null, sponsorName: null })

    expect(prisma.team.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        slogan: null,
        sponsorName: null,
      },
    })
  })

  it('checks existence before remove', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue(null)

    await expect(service.remove(9)).rejects.toThrow('球队不存在')

    expect(prisma.team.delete).not.toHaveBeenCalled()
  })

  it('removes the team after existence check', async () => {
    const { prisma, service } = createService()
    prisma.team.findUnique.mockResolvedValue({ id: 9, name: '皇家高歌' })
    prisma.team.delete.mockResolvedValue({ id: 9 })

    await expect(service.remove(9)).resolves.toEqual({ id: 9 })

    expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: 9 } })
  })
})
