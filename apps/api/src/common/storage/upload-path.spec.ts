import { join, normalize, resolve } from 'node:path'

import {
  miniappAvatarPublicPrefix,
  resolveMiniappAvatarUploadDir,
  resolveUploadRoot,
  uploadPublicPrefix,
} from './upload-path'

describe('upload-path', () => {
  it('uses apps/api/uploads as the default upload root', () => {
    expect(normalize(resolveUploadRoot(''))).toBe(normalize(resolve(__dirname, '../../../uploads')))
  })

  it('prefers API_UPLOAD_ROOT when provided', () => {
    expect(normalize(resolveUploadRoot('/var/www/gaoge-data/uploads'))).toBe(
      normalize('/var/www/gaoge-data/uploads'),
    )
  })

  it('builds the miniapp avatar upload directory from the resolved root', () => {
    expect(normalize(resolveMiniappAvatarUploadDir('/var/www/gaoge-data/uploads'))).toBe(
      normalize(join('/var/www/gaoge-data/uploads', 'miniapp-avatar')),
    )
  })

  it('keeps the public upload prefixes stable', () => {
    expect(uploadPublicPrefix).toBe('/uploads')
    expect(miniappAvatarPublicPrefix).toBe('/uploads/miniapp-avatar')
  })
})
