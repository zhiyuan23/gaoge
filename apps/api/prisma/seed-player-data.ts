import type { Prisma } from '@prisma/client'

export const seedPlayers: Prisma.PlayerCreateInput[] = []

export const shouldResetPlayers = (
  players: Array<Pick<Prisma.PlayerCreateInput, 'playerNumber' | 'nickname'>>,
) => players.length > 0
