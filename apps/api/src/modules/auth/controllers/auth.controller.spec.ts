import { PATH_METADATA } from '@nestjs/common/constants'

import { AuthController } from './auth.controller'

describe('AuthController route metadata', () => {
  it('uses the auth controller prefix', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthController)).toBe('auth')
  })

  it('maps admin login to /auth/admin/login', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthController.prototype.adminLogin)).toBe(
      'admin/login',
    )
  })

  it('maps miniapp login to /auth/miniapp/login', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthController.prototype.wechatLogin)).toBe(
      'miniapp/login',
    )
  })
})
