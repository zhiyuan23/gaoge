import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { CreatePlayerDto } from './create-player.dto'

import 'reflect-metadata'

describe('CreatePlayerDto', () => {
  it('allows create payloads without openid', () => {
    const dto = plainToInstance(CreatePlayerDto, {
      nickname: '高歌7号',
      playerNumber: 7,
    })

    const errors = validateSync(dto)

    expect(errors).toHaveLength(0)
  })

  it('rejects player numbers outside 0 to 100', () => {
    const dto = plainToInstance(CreatePlayerDto, {
      nickname: '高歌101号',
      playerNumber: 101,
    })

    const errors = validateSync(dto)

    expect(errors.some((error) => error.property === 'playerNumber')).toBe(true)
  })
})
