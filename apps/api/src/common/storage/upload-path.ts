import { join, resolve } from 'node:path'

const defaultUploadRoot = resolve(__dirname, '../../../uploads')

export const uploadPublicPrefix = '/uploads'
export const miniappAvatarPublicPrefix = `${uploadPublicPrefix}/miniapp-avatar`
export const contentBannerPublicPrefix = `${uploadPublicPrefix}/content-banner`

export function resolveUploadRoot(configuredRoot = process.env.API_UPLOAD_ROOT) {
  const normalizedRoot = configuredRoot?.trim()

  if (normalizedRoot) {
    return resolve(normalizedRoot)
  }

  return defaultUploadRoot
}

export function resolveMiniappAvatarUploadDir(configuredRoot = process.env.API_UPLOAD_ROOT) {
  return join(resolveUploadRoot(configuredRoot), 'miniapp-avatar')
}

export function resolveContentBannerUploadDir(configuredRoot = process.env.API_UPLOAD_ROOT) {
  return join(resolveUploadRoot(configuredRoot), 'content-banner')
}
