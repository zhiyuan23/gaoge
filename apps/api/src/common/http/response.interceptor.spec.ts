import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { of } from 'rxjs'

import { ResponseInterceptor } from './response.interceptor'

describe('responseInterceptor', () => {
  it('wraps successful responses with the common envelope', (done) => {
    const interceptor = new ResponseInterceptor()
    const next: CallHandler = {
      handle: () => of(['player-1']),
    }

    interceptor.intercept({} as ExecutionContext, next).subscribe({
      next: (value) => {
        expect(value).toEqual({
          code: 0,
          data: ['player-1'],
          errMsg: '',
        })
      },
      complete: done,
    })
  })

  it('passes through mini api result envelopes without wrapping them again', (done) => {
    const interceptor = new ResponseInterceptor()
    const miniResult = {
      success: true,
      data: {
        accessToken: 'mini-token',
      },
      meta: {
        requestId: 'req-1',
        serverTime: '2026-07-18T00:00:00.000Z',
        apiVersion: 'mini-v1',
      },
    }
    const next: CallHandler = {
      handle: () => of(miniResult),
    }

    interceptor.intercept({} as ExecutionContext, next).subscribe({
      next: (value) => {
        expect(value).toBe(miniResult)
      },
      complete: done,
    })
  })

  it('sets no-store cache headers for API responses', (done) => {
    const setHeader = jest.fn()
    const interceptor = new ResponseInterceptor()
    const next: CallHandler = {
      handle: () => of({ list: [] }),
    }
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({
          setHeader,
        }),
      }),
    } as ExecutionContext

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        )
        expect(setHeader).toHaveBeenCalledWith('Pragma', 'no-cache')
        expect(setHeader).toHaveBeenCalledWith('Expires', '0')
        expect(setHeader).toHaveBeenCalledWith('Surrogate-Control', 'no-store')
      },
      complete: done,
    })
  })
})
