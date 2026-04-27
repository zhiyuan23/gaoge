import dayjs from 'dayjs'

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

export function formatBirthDate(value: string | null) {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD')
}

export function getPlayerStatusTagType(status: string) {
  if (status === 'active') {
    return 'success'
  }
  if (status === 'inactive') {
    return 'info'
  }
  return 'warning'
}

export function getPlayerStatusLabel(status: string) {
  if (status === 'active') {
    return '正常'
  }
  if (status === 'inactive') {
    return '停用'
  }
  return status || '-'
}
