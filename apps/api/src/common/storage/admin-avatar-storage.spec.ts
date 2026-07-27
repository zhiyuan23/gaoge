import { Logger } from '@nestjs/common'
import OSS from 'ali-oss'

import { deletePreviousAdminAvatarUrls, saveAdminAvatar } from './admin-avatar-storage'
import { deleteManagedOssObjectByUrl } from './managed-oss-storage'

const mockPut = jest.fn()

jest.mock('ali-oss', () =>
  jest.fn().mockImplementation(() => ({
    put: mockPut,
  })),
)

jest.mock('./managed-oss-storage', () => ({
  buildManagedOssObjectKeyPrefix: jest.fn((folder: string, rootPrefix = 'gaoge') => {
    const normalizedRoot = rootPrefix.replace(/^\/+|\/+$/g, '')

    return `${normalizedRoot}/${folder}/`
  }),
  deleteManagedOssObjectByUrl: jest.fn().mockResolvedValue(undefined),
}))

const originalEnv = process.env

describe('admin-avatar-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Logger.prototype, 'warn').mockImplementation()
    process.env = { ...originalEnv }
    process.env.ALIYUN_OSS_REGION = 'oss-cn-beijing'
    process.env.ALIYUN_OSS_BUCKET = 'gaoge-assets'
    process.env.ALIYUN_OSS_ACCESS_KEY_ID = 'access-key-id'
    process.env.ALIYUN_OSS_ACCESS_KEY_SECRET = 'access-key-secret'
    process.env.ALIYUN_OSS_PUBLIC_BASE_URL = 'https://gaoge-assets.oss-cn-beijing.aliyuncs.com'
    process.env.ALIYUN_OSS_PREFIX = 'gaoge'
  })

  afterAll(() => {
    process.env = originalEnv
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uploads admin avatars to OSS and returns the public object URL', async () => {
    mockPut.mockResolvedValue({ name: 'ignored' })

    const avatarUrl = await saveAdminAvatar({
      file: {
        buffer: Buffer.from('avatar-bytes'),
        mimetype: 'image/png',
        originalname: 'admin-avatar.png',
      },
      request: createRequest(),
      userId: 9,
    })

    expect(OSS).toHaveBeenCalledWith({
      accessKeyId: 'access-key-id',
      accessKeySecret: 'access-key-secret',
      bucket: 'gaoge-assets',
      region: 'oss-cn-beijing',
      secure: true,
    })
    expect(mockPut).toHaveBeenCalledTimes(1)
    expect(mockPut.mock.calls[0]?.[0]).toMatch(/^gaoge\/admin-avatar\/9\/\d+-[0-9a-f-]+\.png$/)
    expect(mockPut.mock.calls[0]?.[1]).toEqual(Buffer.from('avatar-bytes'))
    expect(mockPut.mock.calls[0]?.[2]).toEqual({
      headers: {
        'Content-Type': 'image/png',
      },
    })
    expect(avatarUrl).toMatch(
      /^https:\/\/gaoge-assets\.oss-cn-beijing\.aliyuncs\.com\/gaoge\/admin-avatar\/9\/\d+-[0-9a-f-]+\.png$/,
    )
  })

  it('deletes previous admin avatar URLs only when callers explicitly request cleanup', async () => {
    const oldAvatar =
      'https://gaoge-assets.oss-cn-beijing.aliyuncs.com/gaoge/admin-avatar/9/old.jpg'
    const nextAvatar =
      'https://gaoge-assets.oss-cn-beijing.aliyuncs.com/gaoge/admin-avatar/9/new.jpg'

    await deletePreviousAdminAvatarUrls({
      nextAvatarUrl: nextAvatar,
      previousAvatarUrls: [oldAvatar, nextAvatar, oldAvatar],
      userId: 9,
    })

    expect(deleteManagedOssObjectByUrl).toHaveBeenCalledTimes(1)
    expect(deleteManagedOssObjectByUrl).toHaveBeenCalledWith({
      allowedObjectKeyPrefixes: ['gaoge/admin-avatar/'],
      url: oldAvatar,
    })
  })

  it('keeps avatar save flows successful when previous avatar cleanup fails', async () => {
    jest.mocked(deleteManagedOssObjectByUrl).mockRejectedValue(new Error('oss unavailable'))

    await expect(
      deletePreviousAdminAvatarUrls({
        nextAvatarUrl:
          'https://gaoge-assets.oss-cn-beijing.aliyuncs.com/gaoge/admin-avatar/9/new.jpg',
        previousAvatarUrls: [
          'https://gaoge-assets.oss-cn-beijing.aliyuncs.com/gaoge/admin-avatar/9/old.jpg',
        ],
        userId: 9,
      }),
    ).resolves.toBeUndefined()
  })
})

function createRequest() {
  return {
    get(headerName: string) {
      return headerName.toLowerCase() === 'host' ? 'api.gaoge.cc' : undefined
    },
    headers: {
      'x-forwarded-proto': 'https',
    },
    protocol: 'http',
  }
}
