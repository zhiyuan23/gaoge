/**
 * 预加载图片到本地缓存，支持两种模式
 * @param urls 图片地址数组
 * @param mode 模式：'info' 使用 uni.getImageInfo（仅在线加速），'download' 使用下载+保存（离线可用，默认）
 * @returns Promise<string[]>
 *   - 'info' 模式：返回原 urls 数组（仅触发缓存）
 *   - 'download' 模式：返回本地路径数组（优先持久路径，失败 fallback 原 url）
 */
export const preloadImages = async (
  urls: string[],
  mode: 'info' | 'download' = 'info',
): Promise<string[]> => {
  // 过滤无效 URL
  const validUrls = urls.filter((url): url is string => !!url && typeof url === 'string')

  if (validUrls.length === 0) {
    return []
  }

  if (mode === 'info') {
    validUrls.forEach((url) => {
      uni.getImageInfo({
        src: url,
      })
    })

    return urls
  }

  const results = await Promise.allSettled(
    validUrls.map(
      (url) =>
        new Promise<string>((resolve) => {
          uni.downloadFile({
            url,
            success: (res) => {
              if (res.statusCode === 200) {
                const fs = uni.getFileSystemManager()

                fs.saveFile({
                  tempFilePath: res.tempFilePath,
                  success: (saveRes) => {
                    resolve(saveRes.savedFilePath)
                  },
                  fail: () => {
                    resolve(res.tempFilePath)
                  },
                })
              } else {
                resolve(url)
              }
            },
            fail: () => resolve(url),
          })
        }),
    ),
  )

  return results.map((r, index) => (r.status === 'fulfilled' ? r.value : urls[index] || ''))
}
