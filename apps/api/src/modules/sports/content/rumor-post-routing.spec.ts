import { PATH_METADATA } from '@nestjs/common/constants'

import { PERMISSIONS_KEY } from '@/common/auth/permissions.decorator'
import { contentAdminPermissions, contentViewerPermissions } from '@/modules/auth/permissions'
import { MiniappPublicController } from '@/modules/miniapp/miniapp-public.controller'
import {
  BUILT_IN_MENU_DEFINITIONS,
  BUILT_IN_PERMISSION_DEFINITIONS,
} from '@/modules/system/rbac/builtins'

import { RumorPostController } from './rumor-post/rumor-post.controller'

describe('rumor post naming contract', () => {
  it('maps admin CRUD under /content/rumor-posts', () => {
    expect(Reflect.getMetadata(PATH_METADATA, RumorPostController)).toBe('content/rumor-posts')
  })

  it('maps miniapp public feed under /miniapp/rumor-posts', () => {
    expect(
      Reflect.getMetadata(PATH_METADATA, MiniappPublicController.prototype.listRumorPosts),
    ).toBe('rumor-posts')
  })

  it('uses rumorPost permission codes for admin actions', () => {
    expect(Reflect.getMetadata(PERMISSIONS_KEY, RumorPostController.prototype.findAll)).toEqual([
      'content.rumorPost.view',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, RumorPostController.prototype.create)).toEqual([
      'content.rumorPost.create',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, RumorPostController.prototype.update)).toEqual([
      'content.rumorPost.update',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, RumorPostController.prototype.remove)).toEqual([
      'content.rumorPost.delete',
    ])
    expect(Reflect.getMetadata(PERMISSIONS_KEY, RumorPostController.prototype.publish)).toEqual([
      'content.rumorPost.publish',
    ])
  })

  it('registers rumor post permissions and menu entries in RBAC built-ins', () => {
    expect(BUILT_IN_PERMISSION_DEFINITIONS.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'content.rumorPost.view',
        'content.rumorPost.create',
        'content.rumorPost.update',
        'content.rumorPost.delete',
        'content.rumorPost.publish',
      ]),
    )
    expect(contentAdminPermissions).toEqual(
      expect.arrayContaining([
        'content.rumorPost.view',
        'content.rumorPost.create',
        'content.rumorPost.update',
        'content.rumorPost.delete',
        'content.rumorPost.publish',
      ]),
    )
    expect(contentViewerPermissions).toEqual(expect.arrayContaining(['content.rumorPost.view']))

    expect(BUILT_IN_MENU_DEFINITIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/sports',
          children: expect.arrayContaining([
            expect.objectContaining({
              path: '/sports/content',
              children: expect.arrayContaining([
                expect.objectContaining({
                  name: 'contentRumorPost',
                  title: '流言板',
                  path: '/sports/content/rumor-post',
                  routeName: 'contentRumorPost',
                  permissionCodes: ['content.rumorPost.view'],
                }),
              ]),
            }),
          ]),
        }),
      ]),
    )
  })
})
