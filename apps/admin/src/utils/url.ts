/**
 * 获取API基础URL
 * @returns {string} 完整的API基础URL
 */
export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_APP_BASE_URL.replace(/\/$/, '')
  const apiPrefix = import.meta.env.VITE_APP_API_PREFIX

  // 确保没有双斜杠问题
  return `${baseUrl}${apiPrefix}`
}

/**
 * 获取资源完整URL
 * @param type 资源类型 ('pdf' | 'image' | 'doc')
 * @returns 完整的资源URL
 */
export function getResourceUrl(type: 'pdf' | 'image' | 'doc'): string {
  // 获取环境变量配置
  const baseUrl = import.meta.env.VITE_APP_BASE_URL
  const imagePrefix = import.meta.env.VITE_APP_IMAGE_PREFIX
  const docPrefix = import.meta.env.VITE_APP_DOC_PREFIX

  // 根据资源类型构建URL
  switch (type) {
    case 'image':
      return `${baseUrl.replace(/\/$/, '')}${imagePrefix}`
    case 'doc':
      return `${baseUrl.replace(/\/$/, '')}${docPrefix}`
    default:
      throw new Error(`未知的资源类型: ${type}`)
  }
}
