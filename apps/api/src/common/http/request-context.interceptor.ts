import { randomUUID } from 'node:crypto'
import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'

import { runWithRequestContext } from './request-context'

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<{ headers?: Record<string, string | string[] | undefined> }>()
    const response = http.getResponse<{ setHeader?: (name: string, value: string) => void }>()
    const requestId = resolveRequestId(request.headers?.['x-request-id'])
    response.setHeader?.('X-Request-Id', requestId)

    return new Observable((subscriber) =>
      runWithRequestContext({ requestId }, () => next.handle().subscribe(subscriber)),
    )
  }
}

function resolveRequestId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  return candidate?.trim() || randomUUID()
}
