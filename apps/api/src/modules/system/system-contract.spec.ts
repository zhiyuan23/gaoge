import { SwaggerModule } from '@nestjs/swagger'
import { Test } from '@nestjs/testing'

import { PermissionsGuard } from '@/common/auth/permissions.guard'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { NavigationController } from '../navigation/navigation.controller'
import { NavigationService } from '../navigation/navigation.service'

import { SystemAccessCatalogController } from './access-catalog/system-access-catalog.controller'
import { SystemAccessCatalogService } from './access-catalog/system-access-catalog.service'
import { SystemAuditController } from './audit/system-audit.controller'
import { SystemAuditService } from './audit/system-audit.service'
import { SystemMenuController } from './menu/system-menu.controller'
import { SystemMenuService } from './menu/system-menu.service'
import { SystemMenuConfigurationService } from './menu/system-menu-configuration.service'
import { SystemPermissionController } from './permission/system-permission.controller'
import { SystemPermissionService } from './permission/system-permission.service'
import { SystemResourceController } from './resource/system-resource.controller'
import { SystemResourceService } from './resource/system-resource.service'
import { SystemRoleController } from './role/system-role.controller'
import { SystemRoleService } from './role/system-role.service'
import { SystemUserController } from './user/system-user.controller'
import { SystemUserService } from './user/system-user.service'

describe('RBAC OpenAPI contract', () => {
  it('contains the target-native Resource, catalog, navigation, and audit endpoints', async () => {
    const controllers = [
      NavigationController,
      SystemAccessCatalogController,
      SystemAuditController,
      SystemMenuController,
      SystemPermissionController,
      SystemResourceController,
      SystemRoleController,
      SystemUserController,
    ]
    const services = [
      NavigationService,
      SystemAccessCatalogService,
      SystemAuditService,
      SystemMenuConfigurationService,
      SystemMenuService,
      SystemPermissionService,
      SystemResourceService,
      SystemRoleService,
      SystemUserService,
    ]
    const moduleRef = await Test.createTestingModule({
      controllers,
      providers: services.map((provide) => ({ provide, useValue: {} })),
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile()
    const app = moduleRef.createNestApplication()
    const document = SwaggerModule.createDocument(app, {
      openapi: '3.0.0',
      info: { title: 'gaoge-rbac-contract', version: '1' },
      paths: {},
    })

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/admin/navigation',
        '/system/access-catalog',
        '/system/audit-events',
        '/system/menus/{id}/resources',
        '/system/resources',
        '/system/resources/{id}/permissions',
        '/system/roles/{id}/permissions',
      ]),
    )
    await app.close()
  })
})
