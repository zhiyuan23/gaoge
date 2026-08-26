import { defer, firstValueFrom } from 'rxjs'

import { AuditLogService } from '@/common/audit/audit-log.service'

import { RequestContextInterceptor } from './request-context.interceptor'

describe('request audit context', () => {
  it('propagates the incoming request id into audit events', async () => {
    const prisma = { auditEvent: { create: jest.fn().mockResolvedValue({ id: 1 }) } }
    const interceptor = new RequestContextInterceptor()
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-request-id': 'rbac-request-1' } }),
        getResponse: () => ({ setHeader: jest.fn() }),
      }),
    } as any

    await firstValueFrom(
      interceptor.intercept(context, {
        handle: () =>
          defer(async () => {
            await new AuditLogService(prisma as any).record({ action: 'SYSTEM_ROLE_UPDATED' })
            return undefined
          }),
      }),
    )

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ requestId: 'rbac-request-1' }),
    })
  })
})
