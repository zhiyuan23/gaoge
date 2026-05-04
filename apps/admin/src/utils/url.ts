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
