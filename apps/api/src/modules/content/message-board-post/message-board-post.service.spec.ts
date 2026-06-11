import { MessageBoardPostService } from './message-board-post.service'

describe('MessageBoardPostService', () => {
  const createService = () => {
    const prisma = {
      messageBoardPost: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((actions: Promise<unknown>[]) => Promise.all(actions)),
    }

    const service = new MessageBoardPostService(prisma as any)

    return {
      prisma,
      service,
    }
  }

  it('publishes a draft and writes publishedAt once', async () => {
    const { prisma, service } = createService()
    const draft = {
      id: 12,
      title: '罗马诺更新',
      content: 'Here we go',
      tags: ['转会'],
      sourceName: 'Fabrizio Romano',
      sourceUrl: null,
      status: 'draft',
      isPinned: false,
      publishedAt: null,
      createdAt: new Date('2026-06-10T10:00:00.000Z'),
      updatedAt: new Date('2026-06-10T10:00:00.000Z'),
    }

    prisma.messageBoardPost.findUnique.mockResolvedValue(draft)
    prisma.messageBoardPost.update.mockResolvedValue({
      ...draft,
      status: 'published',
      publishedAt: new Date('2026-06-10T11:00:00.000Z'),
    })

    await service.publish(12)

    expect(prisma.messageBoardPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 12 },
        data: expect.objectContaining({
          status: 'published',
          publishedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('filters admin list by keyword status and tag', async () => {
    const { prisma, service } = createService()

    await service.findAll({
      keyword: '罗马诺',
      status: 'published',
      tag: '转会',
      page: 2,
      pageSize: 5,
    })

    expect(prisma.messageBoardPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'published',
          tags: {
            has: '转会',
          },
          OR: [
            {
              title: {
                contains: '罗马诺',
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: '罗马诺',
                mode: 'insensitive',
              },
            },
            {
              sourceName: {
                contains: '罗马诺',
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: 5,
        take: 5,
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    )
  })

  it('returns only published records for miniapp feed', async () => {
    const { prisma, service } = createService()

    await service.findPublishedForMiniapp({
      page: 1,
      pageSize: 10,
      tag: '比赛日',
    })

    expect(prisma.messageBoardPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'published',
          tags: {
            has: '比赛日',
          },
        },
      }),
    )
  })

  it('sorts miniapp feed by isPinned then publishedAt then id', async () => {
    const { prisma, service } = createService()

    await service.findPublishedForMiniapp()

    expect(prisma.messageBoardPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }],
      }),
    )
  })

  it('builds deduplicated tag options from published records', async () => {
    const { prisma, service } = createService()

    prisma.messageBoardPost.findMany.mockResolvedValueOnce([
      { tags: ['转会', '签约'] },
      { tags: ['比赛日', '转会'] },
      { tags: [''] },
    ])

    const tagOptions = await service.listPublishedTagOptions()

    expect(tagOptions).toEqual([
      { label: '转会', value: '转会' },
      { label: '签约', value: '签约' },
      { label: '比赛日', value: '比赛日' },
    ])
  })
})
