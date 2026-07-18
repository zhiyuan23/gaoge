import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

interface FormatTimeOptions {
  format?: string // 时间格式，如 YYYY-MM-DD
  placeholder?: string // 空值占位符，默认 ''
  relative?: boolean // 是否相对时间显示
  locale?: 'zh-cn' | 'en' // 语言，默认 zh-cn
  status?: 'scheduled' | 'in_progress' | 'completed' | 'canceled' // 比赛状态
}

/**
 * 通用时间格式化函数
 * 支持 number（时间戳）、string（时间字符串）、null/undefined
 */
export const formatTime = (
  time?: number | string | null,
  options: FormatTimeOptions = {},
): string => {
  const { format = 'YYYY-MM-DD', placeholder = '', relative = false, locale = 'zh-cn' } = options

  if (time == null || (typeof time === 'string' && !time.trim())) {
    return placeholder
  }

  let dayjsInstance

  if (typeof time === 'string') {
    dayjsInstance = dayjs(time)
  } else if (typeof time === 'number') {
    const ts = time.toString().length === 10 ? time * 1000 : time
    dayjsInstance = dayjs(ts)
  } else {
    return placeholder
  }

  if (!dayjsInstance.isValid()) {
    return placeholder
  }

  dayjsInstance = dayjsInstance.locale(locale)

  if (relative) {
    return dayjsInstance.fromNow()
  }

  return dayjsInstance.format(format)
}

/**
 * 格式化距离显示
 * @param distance 距离值（单位：米）
 * @param decimal 小数位数，默认为 2
 */
export const formatDistance = (
  distance: number | string | undefined | null,
  decimal = 2,
): string => {
  const num = typeof distance === 'number' ? distance : Number.parseFloat(String(distance))

  if (Number.isNaN(num) || num <= 0) {
    return '0m'
  }

  if (num < 1000) {
    return `${Math.round(num)}m`
  }

  const km = num / 1000
  return `${Number.parseFloat(km.toFixed(decimal))}km`
}

/**
 * 格式化富文本内容，优化图片样式
 * @param htmlStr 原始 HTML 字符串
 * @returns 格式化后的 HTML 字符串
 */
export const formatRichText = (htmlStr: string): string => {
  if (!htmlStr) return ''

  let content = htmlStr

  // 图片样式处理
  content = content.replace(/<img[^>]*\sstyle=['"][^'"]*['"][^>]*>/gi, (match) => {
    return match.replace(/\s+style=['"][^'"]*['"]/i, '')
  })
  content = content.replace(
    /<img/gi,
    '<img style="max-width:100%; max-height:80vh; height:auto; display:block; margin:10px auto; object-fit:contain;"',
  )

  return content
}
