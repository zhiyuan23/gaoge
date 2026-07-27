import { InternalServerErrorException } from '@nestjs/common'
import OSS from 'ali-oss'

type ManagedOssConfig = {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  publicBaseUrl: string
  region: string
}

type DeleteManagedOssObjectByUrlInput = {
  allowedObjectKeyPrefixes: string[]
  url?: string | null
}

export async function deleteManagedOssObjectByUrl({
  allowedObjectKeyPrefixes,
  url,
}: DeleteManagedOssObjectByUrlInput) {
  const objectKey = resolveManagedObjectKey(url, allowedObjectKeyPrefixes)

  if (!objectKey) {
    return
  }

  const config = resolveManagedOssConfig()

  if (!config) {
    return
  }

  const client = new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    region: config.region,
    secure: true,
  })

  await client.delete(objectKey)
}

export function buildManagedOssObjectKeyPrefix(
  folder: string,
  rootPrefix = process.env.ALIYUN_OSS_PREFIX,
) {
  return (
    [normalizeOssPrefix(rootPrefix), normalizeOssPrefix(folder)].filter(Boolean).join('/') + '/'
  )
}

function resolveManagedObjectKey(
  url: string | null | undefined,
  allowedObjectKeyPrefixes: string[],
) {
  const config = resolveManagedOssConfig()

  if (!config || !url) {
    return null
  }

  const normalizedBaseUrl = config.publicBaseUrl.replace(/\/+$/, '')
  const normalizedUrl = stripUrlQueryAndHash(url.trim())
  const objectKey = normalizedUrl.startsWith(`${normalizedBaseUrl}/`)
    ? normalizedUrl.slice(normalizedBaseUrl.length + 1)
    : ''

  if (!objectKey || !allowedObjectKeyPrefixes.some((prefix) => objectKey.startsWith(prefix))) {
    return null
  }

  return objectKey
}

function stripUrlQueryAndHash(value: string) {
  try {
    const url = new URL(value)

    return `${url.origin}${url.pathname}`
  } catch {
    return value
  }
}

function resolveManagedOssConfig(env = process.env): ManagedOssConfig | null {
  const region = normalizeEnvValue(env.ALIYUN_OSS_REGION)
  const bucket = normalizeEnvValue(env.ALIYUN_OSS_BUCKET)
  const accessKeyId = normalizeEnvValue(env.ALIYUN_OSS_ACCESS_KEY_ID)
  const accessKeySecret = normalizeEnvValue(env.ALIYUN_OSS_ACCESS_KEY_SECRET)
  const publicBaseUrl = normalizeEnvValue(env.ALIYUN_OSS_PUBLIC_BASE_URL).replace(/\/+$/, '')
  const requiredValues = [region, bucket, accessKeyId, accessKeySecret, publicBaseUrl]

  if (requiredValues.every(Boolean)) {
    return {
      accessKeyId: accessKeyId as string,
      accessKeySecret: accessKeySecret as string,
      bucket: bucket as string,
      publicBaseUrl: publicBaseUrl as string,
      region: region as string,
    }
  }

  if (requiredValues.some(Boolean)) {
    throw new InternalServerErrorException('OSS 配置不完整')
  }

  return null
}

function normalizeEnvValue(value: string | undefined) {
  return value?.trim().replace(/^"|"$/g, '') || ''
}

function normalizeOssPrefix(value: string | undefined) {
  return normalizeEnvValue(value).replace(/^\/+|\/+$/g, '')
}
