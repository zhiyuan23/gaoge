import type { SearchFormData } from '@/components/common/EsSearch/types'

export interface ListPageRequestResult<ListRow> {
  list: ListRow[]
  total: number
}

export interface UseListPageOptions<SearchModel, ListRow, ListParams> {
  defaultSearch: SearchModel
  defaultPageSize?: number
  buildParams: (search: SearchModel, page: number, pageSize: number) => ListParams
  request: (params: ListParams) => Promise<ListPageRequestResult<ListRow>>
  normalizeSearch?: (formData: SearchFormData) => SearchModel
}

export function useListPage<SearchModel, ListRow, ListParams>(
  options: UseListPageOptions<SearchModel, ListRow, ListParams>,
) {
  const search = ref<SearchModel>({ ...options.defaultSearch })
  const tableData = ref<ListRow[]>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(options.defaultPageSize ?? 15)

  function buildListParams() {
    return options.buildParams(search.value, page.value, pageSize.value)
  }

  // 服务端分页删除到空页时，自动回退到最后一个有效页。
  async function fetchList() {
    loading.value = true
    try {
      const res = await options.request(buildListParams())
      tableData.value = res.list
      total.value = res.total

      if (page.value > 1 && tableData.value.length === 0 && total.value > 0) {
        page.value = Math.max(1, Math.ceil(total.value / pageSize.value))
        return fetchList()
      }
    } finally {
      loading.value = false
    }
  }

  function handleSearch(formData: SearchFormData) {
    search.value = options.normalizeSearch
      ? options.normalizeSearch(formData)
      : ({ ...formData } as SearchModel)
    page.value = 1
    fetchList()
  }

  function handlePaginationChange(params: { page: number; pageSize: number }) {
    page.value = params.page
    pageSize.value = params.pageSize
    fetchList()
  }

  return {
    search,
    tableData,
    total,
    loading,
    page,
    pageSize,
    buildListParams,
    fetchList,
    handleSearch,
    handlePaginationChange,
  }
}
