import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import type { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface ApiResponseEnvelope<T> {
  code: number
  data: T
  errMsg: string
}

export interface MiniApiResultEnvelope<T> {
  success: boolean
  data?: T
  error?: unknown
  meta: unknown
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseEnvelope<unknown> | MiniApiResultEnvelope<unknown>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseEnvelope<unknown> | MiniApiResultEnvelope<unknown>> {
    applyNoStoreHeaders(context)

    return next.handle().pipe(
      map((data) => {
        if (isEnvelope(data)) {
          return data
        }

        if (isMiniApiResult(data)) {
          return data
        }

        return {
          code: 0,
          data,
          errMsg: '',
        }
      }),
    )
  }
}

function isEnvelope(value: unknown): value is ApiResponseEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'data' in value &&
    'errMsg' in value
  )
}

function isMiniApiResult(value: unknown): value is MiniApiResultEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    'data' in value &&
    'meta' in value
  )
}

function applyNoStoreHeaders(context: ExecutionContext) {
  const response = context.switchToHttp?.().getResponse?.()

  if (!response || typeof response.setHeader !== 'function') {
    return
  }

  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.setHeader('Pragma', 'no-cache')
  response.setHeader('Expires', '0')
  response.setHeader('Surrogate-Control', 'no-store')
}
