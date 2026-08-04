import dayjs from 'dayjs'

import type { Player, PlayerListParams, PlayerPayload } from '@/api/football/player'

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
    teamIds: row.teamIds ?? [],
    primaryTeamId: row.primaryTeamId ?? '',
    jerseyName: row.jerseyName ?? '',
    birthDate: row.birthDate ? row.birthDate.slice(0, 10) : '',
    isAdmin: row.isAdmin,
    position: row.position ?? '',
    positions: row.positions ?? [],
    primaryPosition: row.primaryPosition ?? '',
    jerseySize: row.jerseySize ?? '',
    status: row.status ?? 'active',
    superheroName: row.superheroName ?? '',
    signature: row.signature ?? '',
    remark: row.remark ?? '',
  }
}

function normalizeText(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim()
  return trimmed || null
}

export function buildPlayerPayload(model: PlayerFormModel): PlayerPayload {
  return {
    openid: normalizeText(model.openid),
    playerNumber: Number(model.playerNumber),
    nickname: model.nickname.trim(),
    realName: normalizeText(model.realName),
    avatarUrl: normalizeText(model.avatarUrl),
    teamIds: model.teamIds,
    primaryTeamId: model.primaryTeamId === '' ? null : model.primaryTeamId,
    jerseyName: normalizeText(model.jerseyName),
    birthDate: model.birthDate ? dayjs(model.birthDate).startOf('day').toISOString() : undefined,
    isAdmin: model.isAdmin,
    positions: model.positions,
    primaryPosition: model.primaryPosition === '' ? null : model.primaryPosition,
    jerseySize: normalizeText(model.jerseySize),
    status: normalizeText(model.status) ?? 'active',
    superheroName: normalizeNullableText(model.superheroName),
    signature: normalizeText(model.signature),
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
    teamId: search.teamId || undefined,
    position: search.position || undefined,
  }
}
