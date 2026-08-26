import { SystemAuditService } from './system-audit.service'

describe('SystemAuditService', () => {
  it('redacts sensitive metadata recursively and serializes bigint ids', async () => {
    const prisma = {
      auditEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 9n,
            action: 'SYSTEM_USER_PASSWORD_RESET',
            result: 'SUCCEEDED',
            entityType: 'User',
            entityId: '7',
            requestId: null,
            metadata: {
              password: 'secret',
              safe: 'visible',
              nested: { accessToken: 'hidden', count: 1 },
            },
            createdAt: new Date('2026-08-26T00:00:00.000Z'),
            actorUser: { id: 1, account: 'admin', nickname: 'Admin' },
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    }
    const service = new SystemAuditService(prisma as any)

    await expect(service.findAll({ page: 1, pageSize: 20 })).resolves.toMatchObject({
      list: [
        {
          id: '9',
          metadata: { safe: 'visible', nested: { count: 1 } },
        },
      ],
      total: 1,
    })
  })
})
