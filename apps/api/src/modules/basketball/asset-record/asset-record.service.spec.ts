import { BadRequestException, NotFoundException } from '@nestjs/common'

import { AssetRecordService } from './asset-record.service'

describe('AssetRecordService', () => {
  const createService = () => {
    const prisma = {
      basketballAssetRecord: {
        aggregate: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((actions: Promise<unknown>[]) => Promise.all(actions)),
    }

    const service = new AssetRecordService(prisma as any)

    return {
      prisma,
      service,
    }
  }

  it('returns paged list with keyword and season filters', async () => {
    const { prisma, service } = createService()
    prisma.basketballAssetRecord.findMany.mockResolvedValue([{ id: 2 }])
    prisma.basketballAssetRecord.count.mockResolvedValue(4)

    await expect(
      service.findAll({
        keyword: '足球',
        direction: 'expense',
        seasonLabel: '春季赛',
        status: 'confirmed',
        page: '2',
        pageSize: '1',
      } as any),
    ).resolves.toEqual({
      list: [{ id: 2 }],
      total: 4,
    })

    expect(prisma.basketballAssetRecord.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            title: {
              contains: '足球',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: '足球',
              mode: 'insensitive',
            },
          },
        ],
        direction: 'expense',
        seasonLabel: {
          contains: '春季赛',
          mode: 'insensitive',
        },
        status: 'confirmed',
      },
      skip: 1,
      take: 1,
      orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('rejects waived records unless they are zero-amount match-fee income', async () => {
    const { prisma, service } = createService()

    expect(() =>
      service.create(
        {
          direction: 'expense',
          recordType: 'match_fee',
          amount: 100,
          isWaived: true,
          title: '免收异常',
          recordDate: new Date('2026-05-01T00:00:00.000Z'),
          status: 'confirmed',
        } as any,
        1,
      ),
    ).toThrow(new BadRequestException('免收记录仅允许比赛收入且金额必须为 0'))

    expect(prisma.basketballAssetRecord.create).not.toHaveBeenCalled()
  })

  it('creates records with normalized optional text and creator id', async () => {
    const { prisma, service } = createService()
    prisma.basketballAssetRecord.create.mockResolvedValue({ id: 8 })

    await expect(
      service.create(
        {
          direction: 'income',
          recordType: 'match_fee',
          amount: 2000,
          seasonLabel: ' 26赛季春季赛 ',
          matchLabel: ' ',
          isWaived: false,
          title: ' 春季赛场费 ',
          description: ' ',
          recordDate: new Date('2026-05-01T00:00:00.000Z'),
          status: 'confirmed',
        },
        9,
      ),
    ).resolves.toEqual({ id: 8 })

    expect(prisma.basketballAssetRecord.create).toHaveBeenCalledWith({
      data: {
        direction: 'income',
        recordType: 'match_fee',
        amount: 2000,
        seasonLabel: '26赛季春季赛',
        matchLabel: null,
        isWaived: false,
        title: '春季赛场费',
        description: null,
        recordDate: new Date('2026-05-01T00:00:00.000Z'),
        status: 'confirmed',
        creatorId: 9,
      },
    })
  })

  it('returns confirmed summary totals only', async () => {
    const { prisma, service } = createService()
    prisma.basketballAssetRecord.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 120000 } })
      .mockResolvedValueOnce({ _sum: { amount: 66800 } })
    prisma.basketballAssetRecord.count.mockResolvedValue(1)

    await expect(service.getSummary()).resolves.toEqual({
      totalIncome: 120000,
      totalExpense: 66800,
      balance: 53200,
      waivedMatchCount: 1,
    })
  })

  it('throws when the asset record does not exist', async () => {
    const { prisma, service } = createService()
    prisma.basketballAssetRecord.findUnique.mockResolvedValue(null)

    await expect(service.findOne(404)).rejects.toThrow(new NotFoundException('资产记录不存在'))
  })
})
