import dayjs from 'dayjs'

import type { Player, PlayerListParams, PlayerPayload } from '@/api/basketball/player'

import type { PlayerFormModel, PlayerSearch } from './types'

export function createPlayerFormFromRow(row: Player): PlayerFormModel {
  return {
    id: row.id,
    openid: row.openid ?? '',
    playerNumber: row.playerNumber ?? null,
    nickname: row.nickname,
    realName: row.realName ?? '',
    avatarUrl: row.avatarUrl ?? '',
    subTeam: row.subTeam ?? '',
    jerseyName: row.jerseyName ?? '',
    birthDate: row.birthDate ? row.birthDate.slice(0, 10) : '',
    isAdmin: row.isAdmin,
    position: row.position ?? '',
    jerseySize: row.jerseySize ?? '',
    status: row.status ?? 'active',
    remark: row.remark ?? '',
  }
}

function normalizeText(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

export function buildPlayerPayload(model: PlayerFormModel): PlayerPayload {
  return {
    openid: normalizeText(model.openid),
    playerNumber: Number(model.playerNumber),
    nickname: model.nickname.trim(),
    realName: normalizeText(model.realName),
    avatarUrl: normalizeText(model.avatarUrl),
    subTeam: normalizeText(model.subTeam),
    jerseyName: normalizeText(model.jerseyName),
    birthDate: model.birthDate ? dayjs(model.birthDate).startOf('day').toISOString() : undefined,
    isAdmin: model.isAdmin,
    position: normalizeText(model.position),
    jerseySize: normalizeText(model.jerseySize),
    status: normalizeText(model.status) ?? 'active',
    remark: normalizeText(model.remark),
  }
}

export function buildPlayerListParams(
  search: PlayerSearch,
  page: number,
  pageSize: number,
): PlayerListParams {
  return {
    page,
    pageSize,
    keyword: search.keyword || undefined,
    subTeam: search.subTeam || undefined,
  }
}
