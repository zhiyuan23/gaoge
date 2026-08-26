import { BadRequestException, ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '@/common/prisma/prisma.service'

const SERIALIZABLE_RETRY_LIMIT = 3

export async function runSerializable<T>(
  prisma: PrismaService,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  for (let attempt = 1; attempt <= SERIALIZABLE_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      if (!isRetryableTransactionError(error)) {
        throw error
      }
      if (attempt === SERIALIZABLE_RETRY_LIMIT) {
        throw new ConflictException('事务并发冲突，请重试')
      }
    }
  }

  throw new ConflictException('事务并发冲突，请重试')
}

export function assertExpectedUpdatedAt(current: Date, expectedUpdatedAt?: string) {
  if (!expectedUpdatedAt) {
    throw new BadRequestException('RBAC_EXPECTED_UPDATED_AT_REQUIRED')
  }

  const expected = new Date(expectedUpdatedAt)
  if (Number.isNaN(expected.getTime()) || current.getTime() !== expected.getTime()) {
    throw new ConflictException('RBAC_CONCURRENT_MODIFICATION')
  }
}

function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034'
}
