import { resolveListenOptions } from './listen-options'

describe('listen-options', () => {
  it('uses 3000 and 0.0.0.0 by default so local devices can reach the API', () => {
    expect(resolveListenOptions({})).toEqual({
      host: '0.0.0.0',
      port: 3000,
    })
  })

  it('keeps existing PORT/APP_PORT behavior and allows host override', () => {
    expect(
      resolveListenOptions({
        APP_HOST: '127.0.0.1',
        APP_PORT: '3100',
        HOST: 'localhost',
        PORT: '3200',
      }),
    ).toEqual({
      host: 'localhost',
      port: '3200',
    })
  })
})
