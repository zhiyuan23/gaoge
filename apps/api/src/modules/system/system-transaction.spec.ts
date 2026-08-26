import { BadRequestException, ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { assertExpectedUpdatedAt, runSerializable } from './system-transaction'

describe('system transactions', () => {
  it('rejects stale optimistic-concurrency timestamps', () => {
    expect(() =>
      assertExpectedUpdatedAt(new Date('2026-08-26T00:00:00.000Z'), '2026-08-25T00:00:00.000Z'),
    ).toThrow(ConflictException)
  })

  it('requires an optimistic-concurrency timestamp for updates', () => {
    expect(() => assertExpectedUpdatedAt(new Date('2026-08-26T00:00:00.000Z'))).toThrow(
      BadRequestException,
    )
  })

  it('retries Prisma P2034 serialization conflicts and then succeeds', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: '5.22.0',
    })
    const prisma = {
      $transaction: jest.fn().mockRejectedValueOnce(conflict).mockResolvedValueOnce('ok'),
    }

    await expect(runSerializable(prisma as any, async () => 'ignored')).resolves.toBe('ok')
    expect(prisma.$transaction).toHaveBeenCalledTimes(2)
  })

  it('maps an exhausted Prisma P2034 serialization conflict to an API conflict', async () => {
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: '5.22.0',
    })
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(conflict),
    }

    await expect(runSerializable(prisma as any, async () => 'ignored')).rejects.toThrow(
      '事务并发冲突，请重试',
    )
    expect(prisma.$transaction).toHaveBeenCalledTimes(3)
  })
})
