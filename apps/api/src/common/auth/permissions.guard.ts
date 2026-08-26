import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { PERMISSIONS_KEY, PERMISSIONS_MODE_KEY } from './permissions.decorator'

export type PermissionUser = { permissions?: string[] }

export function assertUserPermission(user: PermissionUser | undefined, permission: string) {
  if (!user?.permissions?.includes(permission)) {
    throw new ForbiddenException('暂无权限执行此操作')
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPermissions?.length) {
      return true
    }

    const permissionMode = this.reflector.getAllAndOverride<'all' | undefined>(
      PERMISSIONS_MODE_KEY,
      [context.getHandler(), context.getClass()],
    )
    const request = context.switchToHttp().getRequest()
    const user = request.user as PermissionUser | undefined

    if (!user?.permissions?.length) {
      throw new ForbiddenException('暂无权限执行此操作')
    }

    const hasPermission =
      permissionMode === 'all'
        ? requiredPermissions.every((permission) => user.permissions?.includes(permission))
        : requiredPermissions.some((permission) => user.permissions?.includes(permission))
    if (!hasPermission) {
      throw new ForbiddenException('暂无权限执行此操作')
    }

    return true
  }
}
