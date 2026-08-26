import { ForbiddenException } from '@nestjs/common'

import { assertUserPermission, PermissionsGuard } from './permissions.guard'

describe('PermissionsGuard', () => {
  function createContext(permissions: string[]) {
    return {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user: { permissions } }) }),
    } as any
  }

  it('keeps RequirePermissions as any-of authorization', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(['system.role.enable', 'system.role.disable'])
        .mockReturnValueOnce(undefined),
    }
    const guard = new PermissionsGuard(reflector as any)

    expect(guard.canActivate(createContext(['system.role.enable']))).toBe(true)
  })

  it('requires every permission for compound configuration endpoints', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(['system.role.update', 'system.role.assign-permission'])
        .mockReturnValueOnce('all'),
    }
    const guard = new PermissionsGuard(reflector as any)

    expect(() => guard.canActivate(createContext(['system.role.update']))).toThrow(
      ForbiddenException,
    )
  })

  it('checks the permission selected by a status payload', () => {
    expect(() =>
      assertUserPermission({ permissions: ['system.user.update'] }, 'system.user.disable'),
    ).toThrow(ForbiddenException)
  })
})
