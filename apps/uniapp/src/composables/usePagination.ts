export interface PaginationOptions<T> {
  /** 请求函数，返回原始响应数据（任意结构） */
  request: (params: { page: number; pageSize: number }) => Promise<any>

  /** 可选：从响应中提取列表和判断是否有更多的逻辑 */
  normalize?: (res: any) => {
    list: T[]
    hasMore: boolean
  }

  /** 每页大小，默认 10 */
  pageSize?: number
  /** 是否立即加载第一页，默认 true */
  immediate?: boolean
  /** 下拉刷新时是否重置列表，默认 true */
  resetOnRefresh?: boolean
}

export const usePagination = <T>(options: PaginationOptions<T>) => {
  const { request, normalize, pageSize = 10, immediate = true, resetOnRefresh = true } = options

  const list = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const finished = ref(false)
  const error = ref(false)
  const page = ref(1)

  const defaultNormalize = (res: any): { list: T[]; hasMore: boolean } => {
    // 直接返回数组
    if (Array.isArray(res)) {
      return { list: res, hasMore: res.length === pageSize }
    }

    // 返回 { rows: [], total: number }
    if ('rows' in res && 'total' in res) {
      return {
        list: res.rows || [],
        hasMore: res.rows.length === pageSize,
      }
    }

    // 当作数组处理
    return { list: [], hasMore: false }
  }

  const getData = normalize || defaultNormalize

  const load = async (isRefresh = false) => {
    if (loading.value) return
    if (finished.value && !isRefresh) return

    if (isRefresh) {
      page.value = 1
      finished.value = false
      error.value = false
      if (resetOnRefresh) list.value = []
    }

    loading.value = true
    error.value = false

    try {
      const res = await request({
        page: page.value,
        pageSize,
      })

      const { list: newList, hasMore } = getData(res)

      if (isRefresh) {
        list.value = newList
      } else {
        list.value = [...list.value, ...newList]
      }

      if (!hasMore) {
        finished.value = true
      } else {
        page.value += 1
      }
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  const reload = () => load(true)
  const reset = () => {
    list.value = []
    page.value = 1
    finished.value = false
    error.value = false
  }

  if (immediate) {
    void load()
  }

  return {
    list: readonly(list),
    loading: readonly(loading),
    finished: readonly(finished),
    error: readonly(error),
    load,
    reload,
    reset,
  }
}

// ==================== 使用示例 ====================
/**
 * 基础用法 - 后端返回 { rows: [], total: number }
 */
// const { list, loading, finished, error, load, reload } = usePagination({
//   request: ({ page, pageSize }) =>
//     getGoodsList({
//       page,
//       pageSize,
//       status: status.value,
//       keyword: keyword.value,
//       categoryId: categoryId.value,
//     }),
//   normalize: (res) => ({
//     list: res.data.rows,
//     hasMore: res.data.rows.length === pageSize,
//   }),
//   pageSize: 20,
//   immediate: true,
// })

/**
 * 简单数组返回 + 自定义 pageSize
 */
// usePagination<Article>({
//   request: ({ page, pageSize }) => getArticles(page, pageSize),
//   pageSize: 15,
// })

/**
 * 筛选条件变化时自动重置并重新加载
 */
// watch([status, keyword, categoryId], () => {
//   reload()  // reload 会自动把 page 重置为 1，并清空旧列表
// })
