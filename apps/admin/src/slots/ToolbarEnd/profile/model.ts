import type { AuthUser, UpdateAuthProfilePayload } from '@gaoge/shared-types'

export interface ProfileDraft {
  nickname: string
  avatarUrl: string
}

export const createProfileDraft = (profile: AuthUser): ProfileDraft => ({
  nickname: profile.nickname ?? '',
  avatarUrl: profile.avatarUrl ?? '',
})

export const buildProfilePayload = (draft: ProfileDraft): UpdateAuthProfilePayload => ({
  nickname: draft.nickname.trim(),
  avatarUrl: draft.avatarUrl.trim() || null,
})

export const isProfileDirty = (draft: ProfileDraft, profile: AuthUser) => {
  const payload = buildProfilePayload(draft)

  return payload.nickname !== (profile.nickname ?? '') || payload.avatarUrl !== profile.avatarUrl
}
