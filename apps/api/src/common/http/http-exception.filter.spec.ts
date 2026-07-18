import { BadRequestException } from '@nestjs/common'

import { HttpExceptionFilter } from './http-exception.filter'

describe('httpExceptionFilter', () => {
  it('maps validation messages into the common envelope', () => {
    const filter = new HttpExceptionFilter()
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
      }),
    }

    filter.catch(new BadRequestException(['openid must be a string']), host as any)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      code: 400,
      data: null,
      errMsg: 'openid must be a string',
    })
  })

  it('maps mini v1 errors into the mini api failure envelope', () => {
    const filter = new HttpExceptionFilter()
    const status = jest.fn().mockReturnThis()
    const json = jest.fn()
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({
          path: '/mini/v1/auth/wechat-login',
          headers: {
            'x-request-id': 'req-error',
          },
        }),
        getResponse: () => ({ status, json }),
      }),
    }

    filter.catch(new BadRequestException(['code should not be empty']), host as any)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'code should not be empty',
      },
      meta: {
        requestId: 'req-error',
        serverTime: expect.any(String),
        apiVersion: 'mini-v1',
      },
    })
  })
})
