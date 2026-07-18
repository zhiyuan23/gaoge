import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import {
  Catch,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import type { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let errorCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const errMsg = this.getErrorMessage(exception, errorCode)

    // 对于Prisma业务错误，使用400作为错误码而不是500
    if (this.isBusinessError(exception)) {
      errorCode = 400
    }

    const request = ctx.getRequest?.()

    if (isMiniV1Request(request)) {
      response.status(HttpStatus.OK).json({
        success: false,
        error: {
          code: resolveMiniErrorCode(exception),
          message: errMsg,
        },
        meta: {
          requestId: resolveMiniRequestId(request),
          serverTime: new Date().toISOString(),
          apiVersion: 'mini-v1',
        },
      })
      return
    }

    // 所有错误都返回HTTP 200状态码，在响应体的code字段处理错误状态
    response.status(HttpStatus.OK).json({
      code: errorCode,
      data: null,
      errMsg,
    })
  }

  private isBusinessError(exception: unknown): boolean {
    // 检查是否是Prisma已知的业务错误
    if (exception instanceof Error && 'code' in exception) {
      const prismaError = exception as { code: string }
      return ['P2002', 'P2025', 'P2003', 'P2000'].includes(prismaError.code)
    }
    return false
  }

  private getErrorMessage(exception: unknown, status: number): string {
    // 处理Prisma数据库错误
    if (exception instanceof Error && 'code' in exception) {
      const prismaError = exception as { code: string; meta?: { target?: string[] } }

      // 唯一约束冲突
      if (prismaError.code === 'P2002') {
        const fields = prismaError.meta?.target?.join('、') || ''
        if (fields.includes('openid')) {
          return '该微信用户已经存在，请勿重复创建'
        }
        if (fields) {
          return `${fields} 已存在，请勿重复提交`
        }
        return '数据已存在，请勿重复提交'
      }

      // 记录不存在
      if (prismaError.code === 'P2025') {
        return '要操作的记录不存在或已被删除'
      }

      // 外键约束错误
      if (prismaError.code === 'P2003') {
        return '关联数据不存在，请检查输入'
      }

      // 字段值超出范围
      if (prismaError.code === 'P2000') {
        return '输入内容过长，请减少内容后重试'
      }
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse()
      if (typeof payload === 'string' && payload) {
        return payload
      }

      if (typeof payload === 'object' && payload !== null) {
        const message = (payload as { message?: string | string[] }).message
        if (Array.isArray(message)) {
          return message.join('，')
        }
        if (typeof message === 'string' && message) {
          return message
        }
      }

      return exception.message || HttpStatus[status] || '请求失败'
    }

    if (exception instanceof Error && exception.message) {
      // 隐藏敏感的错误详情
      if (status === 500) {
        return '服务器内部错误，请稍后重试'
      }
      return exception.message
    }

    return '请求失败，请稍后重试'
  }
}

function isMiniV1Request(request: unknown) {
  if (!request || typeof request !== 'object') {
    return false
  }

  const path =
    (request as { path?: string; url?: string; originalUrl?: string }).path ??
    (request as { url?: string }).url ??
    (request as { originalUrl?: string }).originalUrl

  return typeof path === 'string' && path.startsWith('/mini/v1/')
}

function resolveMiniRequestId(request: {
  headers?: Record<string, string | string[] | undefined>
}) {
  const value = request.headers?.['x-request-id']

  if (Array.isArray(value)) {
    return value[0] || createFallbackRequestId()
  }

  return value || createFallbackRequestId()
}

function resolveMiniErrorCode(exception: unknown) {
  if (exception instanceof UnauthorizedException) {
    return 'UNAUTHORIZED'
  }

  if (exception instanceof ForbiddenException) {
    return 'FORBIDDEN'
  }

  return 'INTERNAL_ERROR'
}

function createFallbackRequestId() {
  return `server-${Date.now()}`
}
