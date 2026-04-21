import type { AxiosRequestConfig } from 'axios'
import { saveAs } from 'file-saver'

import api from '@/api/index'

/**
 * 安全解码RFC2047编码的文件名
 */
function safeDecodeRFC2047(encoded: string): string {
  try {
    // 1. 严格匹配RFC2047格式
    const match = encoded.match(/^=\?([A-Z0-9-]+)\?B\?(.+)\?=$/i)
    if (!match) {
      return encoded
    }

    // 2. 清理Base64字符串（移除换行符/空格等）
    const base64 = match[2].replace(/[^A-Z0-9+/=]/gi, '')

    // 3. 补全Base64长度（避免长度非4的倍数报错）
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')

    // 4. 安全解码
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )
  } catch (e) {
    console.warn('RFC2047解码失败，使用原始值:', encoded, e)
    return encoded
  }
}

/**
 * 解析Content-Disposition头
 */
function parseContentDisposition(header: string): string | null {
  const matches = header.match(/filename\*?=("?)([^"]+)\1/i)
  return matches ? safeDecodeRFC2047(matches[2]) : null
}

export async function downloadFile(
  url: string,
  defaultFilename: string,
  config?: AxiosRequestConfig,
): Promise<boolean> {
  const response = await api.get(url, {
    ...config,
    responseType: 'blob',
    raw: true,
  })

  // 解析文件名
  let filename = parseContentDisposition(response.headers['content-disposition']) || defaultFilename

  // 安全处理文件名
  filename = filename.replace(/[/\\:*?"<>|]/g, '_').replace(/\s{2,}/g, ' ')

  saveAs(new Blob([response.data]), filename)
  return true
}
