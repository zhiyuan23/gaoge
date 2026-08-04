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

  it.each([null, '蝙蝠侠'])('accepts an optional superhero name: %s', (superheroName) => {
    const dto = plainToInstance(CreatePlayerDto, {
      nickname: '高歌7号',
      playerNumber: 7,
      superheroName,
    })

    const errors = validateSync(dto)

    expect(errors.some((error) => error.property === 'superheroName')).toBe(false)
  })

  it('rejects superhero names longer than 50 characters', () => {
    const dto = plainToInstance(CreatePlayerDto, {
      nickname: '高歌7号',
      playerNumber: 7,
      superheroName: 'A'.repeat(51),
    })

    const errors = validateSync(dto)

    expect(errors.some((error) => error.property === 'superheroName')).toBe(true)
  })
})
