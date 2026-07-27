import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common'
import OSS from 'ali-oss'
import type { Request } from 'express'

import { buildManagedOssObjectKeyPrefix, deleteManagedOssObjectByUrl } from './managed-oss-storage'
import { adminAvatarPublicPrefix, resolveAdminAvatarUploadDir } from './upload-path'

export type AdminUploadedFile = {
  buffer: Buffer
  mimetype: string
  originalname: string
}

type SaveAdminAvatarInput = {
  file?: AdminUploadedFile
  request: Request
  userId: number
}

type OssConfig = {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  prefix: string
  publicBaseUrl: string
  region: string
}

type DeletePreviousAdminAvatarUrlsInput = {
  nextAvatarUrl?: string | null
  previousAvatarUrls: Array<string | null | undefined>
  userId: number
}

const logger = new Logger('AdminAvatarStorage')

export async function saveAdminAvatar({ file, request, userId }: SaveAdminAvatarInput) {
  assertAvatarFile(file)

  const ext = resolveAvatarExtension(file)
  const filename = `${Date.now()}-${randomUUID()}${ext}`
  const ossConfig = resolveOssConfig()

  if (ossConfig) {
    return uploadAdminAvatarToOss(file, filename, userId, ossConfig)
  }

  return saveAdminAvatarToLocal(request, file, filename)
}

export async function deletePreviousAdminAvatarUrls({
  nextAvatarUrl,
  previousAvatarUrls,
  userId,
}: DeletePreviousAdminAvatarUrlsInput) {
  const allowedObjectKeyPrefixes = [buildManagedOssObjectKeyPrefix('admin-avatar')]
  const urls = Array.from(
    new Set(previousAvatarUrls.filter((url): url is string => Boolean(url))),
  ).filter((url) => url !== nextAvatarUrl)

  for (const url of urls) {
    try {
      await deleteManagedOssObjectByUrl({
        allowedObjectKeyPrefixes,
        url,
      })
    } catch (error) {
      logger.warn(
        `Failed to delete previous admin avatar for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}

function assertAvatarFile(file?: AdminUploadedFile): asserts file is AdminUploadedFile {
  if (!file?.buffer?.length) {
    throw new BadRequestException('请上传头像文件')
  }

  if (!file.mimetype?.startsWith('image/')) {
    throw new BadRequestException('头像文件格式不正确')
  }
}

async function uploadAdminAvatarToOss(
  file: AdminUploadedFile,
  filename: string,
  userId: number,
  config: OssConfig,
) {
  const client = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    region: config.region,
    secure: true,
  })
  const objectKey = buildOssObjectKey(config.prefix, userId, filename)

  await client.put(objectKey, file.buffer, {
    headers: {
      'Content-Type': file.mimetype,
    },
  })

  return `${config.publicBaseUrl}/${objectKey}`
}

async function saveAdminAvatarToLocal(request: Request, file: AdminUploadedFile, filename: string) {
  const host = request.get('host')

  if (!host) {
    throw new BadRequestException('无法识别上传地址')
  }

  const protocol = resolveRequestProtocol(request)
  const adminAvatarUploadDir = resolveAdminAvatarUploadDir()

  await mkdir(adminAvatarUploadDir, { recursive: true })
  await writeFile(join(adminAvatarUploadDir, filename), file.buffer)

  return `${protocol}://${host}${adminAvatarPublicPrefix}/${filename}`
}

function resolveOssConfig(env = process.env): OssConfig | null {
  const region = normalizeEnvValue(env.ALIYUN_OSS_REGION)
  const bucket = normalizeEnvValue(env.ALIYUN_OSS_BUCKET)
  const accessKeyId = normalizeEnvValue(env.ALIYUN_OSS_ACCESS_KEY_ID)
  const accessKeySecret = normalizeEnvValue(env.ALIYUN_OSS_ACCESS_KEY_SECRET)
  const publicBaseUrl = normalizePublicBaseUrl(env.ALIYUN_OSS_PUBLIC_BASE_URL)
  const prefix = normalizeOssPrefix(env.ALIYUN_OSS_PREFIX)
  const requiredValues = [region, bucket, accessKeyId, accessKeySecret, publicBaseUrl]

  if (requiredValues.every(Boolean)) {
    return {
      accessKeyId: accessKeyId as string,
      accessKeySecret: accessKeySecret as string,
      bucket: bucket as string,
      prefix,
      publicBaseUrl: publicBaseUrl as string,
      region: region as string,
    }
  }

  if (requiredValues.some(Boolean)) {
    throw new InternalServerErrorException('OSS 配置不完整')
  }

  return null
}

function buildOssObjectKey(prefix: string, userId: number, filename: string) {
  return [prefix, 'admin-avatar', String(userId), filename].filter(Boolean).join('/')
}

function normalizeEnvValue(value: string | undefined) {
  return value?.trim().replace(/^"|"$/g, '') || ''
}

function normalizePublicBaseUrl(value: string | undefined) {
  return normalizeEnvValue(value).replace(/\/+$/, '')
}

function normalizeOssPrefix(value: string | undefined) {
  return normalizeEnvValue(value).replace(/^\/+|\/+$/g, '')
}

function resolveRequestProtocol(request: Request) {
  const forwardedProtocol = request.headers['x-forwarded-proto']

  if (typeof forwardedProtocol === 'string' && forwardedProtocol.trim()) {
    return forwardedProtocol.split(',')[0].trim()
  }

  return request.protocol
}

function resolveAvatarExtension(file: AdminUploadedFile) {
  const fileExt = extname(file.originalname || '').toLowerCase()

  if (fileExt) {
    return fileExt
  }

  switch (file.mimetype) {
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    default:
      return '.jpg'
  }
}
