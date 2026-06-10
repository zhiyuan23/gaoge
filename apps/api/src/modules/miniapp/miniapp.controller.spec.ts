import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants'

import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'

import { MiniappController } from './miniapp.controller'

describe('MiniappController', () => {
  it('uses the miniapp controller prefix', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappController)).toBe('miniapp')
  })

  it('applies JwtAuthGuard at the controller level', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, MiniappController)).toEqual([JwtAuthGuard])
  })

  it('maps getMe to /miniapp/me', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappController.prototype.getMe)).toBe('me')
  })

  it('maps listBindOptions to /miniapp/football-player/bind-options', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappController.prototype.listBindOptions)).toBe(
      'football-player/bind-options',
    )
  })

  it('maps bindFootballPlayer to /miniapp/football-player/bind', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappController.prototype.bindFootballPlayer)).toBe(
      'football-player/bind',
    )
  })

  it('maps updateProfile to /miniapp/me/profile', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappController.prototype.updateProfile)).toBe(
      'me/profile',
    )
  })

  it('maps uploadAvatar to /miniapp/me/avatar', () => {
    expect(Reflect.getMetadata(PATH_METADATA, MiniappController.prototype.uploadAvatar)).toBe(
      'me/avatar',
    )
  })

  it('delegates /miniapp/me to the service with request.user.id', () => {
    const miniappService = {
      getMe: jest.fn().mockReturnValue({ ok: true }),
      listBindOptions: jest.fn(),
      bindFootballPlayer: jest.fn(),
      updateProfile: jest.fn(),
    }
    const controller = new MiniappController(miniappService as any)

    const result = controller.getMe({ user: { id: 5 } })

    expect(result).toEqual({ ok: true })
    expect(miniappService.getMe).toHaveBeenCalledWith(5)
  })

  it('delegates /miniapp/football-player/bind-options to the service', () => {
    const miniappService = {
      getMe: jest.fn(),
      listBindOptions: jest.fn().mockReturnValue({ list: [] }),
      bindFootballPlayer: jest.fn(),
      updateProfile: jest.fn(),
    }
    const controller = new MiniappController(miniappService as any)

    const result = controller.listBindOptions()

    expect(result).toEqual({ list: [] })
    expect(miniappService.listBindOptions).toHaveBeenCalledWith()
  })

  it('delegates /miniapp/football-player/bind to the service with request.user.id and dto.playerNumber', () => {
    const miniappService = {
      getMe: jest.fn(),
      listBindOptions: jest.fn(),
      bindFootballPlayer: jest.fn().mockReturnValue({ ok: true }),
      updateProfile: jest.fn(),
    }
    const controller = new MiniappController(miniappService as any)

    const result = controller.bindFootballPlayer({ user: { id: 6 } }, { playerNumber: 11 })

    expect(result).toEqual({ ok: true })
    expect(miniappService.bindFootballPlayer).toHaveBeenCalledWith(6, 11)
  })

  it('delegates /miniapp/me/profile to the service with request.user.id and full player profile dto', () => {
    const miniappService = {
      getMe: jest.fn(),
      listBindOptions: jest.fn(),
      bindFootballPlayer: jest.fn(),
      updateProfile: jest.fn().mockReturnValue({ ok: true }),
    }
    const controller = new MiniappController(miniappService as any)

    const dto = {
      nickname: '新昵称',
      realName: '真实姓名',
      subTeam: 'real',
      jerseyName: 'NEW NAME',
      birthDate: new Date('1990-06-10T00:00:00.000Z'),
      position: 'midfielder',
      jerseySize: 'L',
      remark: '核心球员',
    }
    const result = controller.updateProfile({ user: { id: 9 } }, dto)

    expect(result).toEqual({ ok: true })
    expect(miniappService.updateProfile).toHaveBeenCalledWith(9, dto)
  })
})
