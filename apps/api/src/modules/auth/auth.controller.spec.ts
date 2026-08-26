import { GUARDS_METADATA } from '@nestjs/common/constants'

import { ROLES_KEY } from '@/common/auth/roles.decorator'

import { AuthController } from './auth.controller'
import { JwtAuthGuard } from './jwt-auth.guard'

describe('AuthController permission contract', () => {
  it('lets every authenticated admin client resolve its own RBAC permissions', () => {
    const handler = AuthController.prototype.permission

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([JwtAuthGuard])
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined()
  })
})
