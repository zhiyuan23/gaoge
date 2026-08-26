import { SetMetadata } from '@nestjs/common'

export const PERMISSIONS_KEY = 'permissions'
export const PERMISSIONS_MODE_KEY = 'permissions-mode'

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions)

export const RequireAllPermissions =
  (...permissions: string[]) =>
  (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, propertyKey!, descriptor!)
    SetMetadata(PERMISSIONS_MODE_KEY, 'all')(target, propertyKey!, descriptor!)
  }
