<route lang="yaml">
meta:
  title: Banner 管理
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import Sortable from 'sortablejs'

import type { Banner, BannerPayload, ReorderBannerPayload } from '@/api/content/banner'
import bannerApi from '@/api/content/banner'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import BannerFormDialog from './components/BannerFormDialog.vue'
import { BANNER_DEFAULT_SEARCH } from './model/defaults'
import { buildBannerListParams, normalizeBannerListResponse } from './model/mapper'
import type { BannerSearch } from './model/types'
import {
  getBannerJumpTypeLabel,
  getBannerStatusLabel,
  getBannerStatusTagType,
} from './schemas/form'
import { createBannerSearchFields } from './schemas/search'
import { BANNER_TABLE_COLUMNS, formatDateTime } from './schemas/table'
import { BANNER_PERMISSIONS } from './auth'

defineOptions({
  name: 'ContentBannerPage',
})

const submitLoading = ref(false)
const reorderLoading = ref(false)
const tableWrapperRef = ref<HTMLElement>()
let sortableInstance: Sortable | null = null

const searchFields = computed(() => createBannerSearchFields())

const {
  search,
  tableData,
  loading,
  fetchList: fetchBanners,
  handleSearch: applySearch,
} = useListPage<BannerSearch, Banner, ReturnType<typeof buildBannerListParams>>({
  defaultSearch: BANNER_DEFAULT_SEARCH,
  buildParams: buildBannerListParams,
  request: async (params) => normalizeBannerListResponse(await bannerApi.list(params)),
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
      status: String(formData.status ?? ''),
      jumpType: String(formData.jumpType ?? ''),
    }
  },
})

const tableLoading = computed(() => loading.value || reorderLoading.value)
const isDefaultSearchCondition = computed(
  () =>
    search.value.keyword === BANNER_DEFAULT_SEARCH.keyword &&
    search.value.status === BANNER_DEFAULT_SEARCH.status &&
    search.value.jumpType === BANNER_DEFAULT_SEARCH.jumpType,
)
const canDragSort = computed(
  () => isDefaultSearchCondition.value && !tableLoading.value && tableData.value.length > 1,
)

const {
  dialogVisible,
  dialogMode,
  currentRow: currentBanner,
  openCreate,
  openEdit,
} = useCrudDialog<Banner>()

function handleAdd() {
  openCreate()
}

function destroySortable() {
  sortableInstance?.destroy()
  sortableInstance = null
}

async function syncSortable() {
  destroySortable()

  if (!canDragSort.value) {
    return
  }

  await nextTick()

  const tableBody = tableWrapperRef.value?.querySelector<HTMLTableSectionElement>(
    '.el-table__body-wrapper tbody',
  )

  if (!tableBody) {
    return
  }

  sortableInstance = Sortable.create(tableBody, {
    animation: 180,
    handle: '.banner-drag-handle',
    ghostClass: 'banner-sort-ghost',
    chosenClass: 'banner-sort-chosen',
    async onEnd(event: Sortable.SortableEvent) {
      const { oldIndex, newIndex } = event

      if (
        oldIndex == null ||
        newIndex == null ||
        oldIndex === newIndex ||
        !isDefaultSearchCondition.value
      ) {
        return
      }

      const nextRows = [...tableData.value]
      const [movedRow] = nextRows.splice(oldIndex, 1)

      if (!movedRow) {
        return
      }

      nextRows.splice(newIndex, 0, movedRow)
      await submitReorder(nextRows)
    },
  })
}

async function submitReorder(rows: Banner[]) {
  const payload: ReorderBannerPayload = {
    items: rows.map((row, index) => ({
      id: row.id,
      sort: (rows.length - index) * 100,
    })),
  }

  reorderLoading.value = true
  destroySortable()
  tableData.value = [...rows]

  try {
    await bannerApi.reorder(payload)
    ElMessage.success('排序已更新')
    await fetchBanners()
  } catch {
    await fetchBanners()
  } finally {
    reorderLoading.value = false
  }
}

function handleSearch(formData: SearchFormData) {
  destroySortable()
  applySearch(formData)
}

function handleTableAction(payload: { row: Banner; action: { key: string } }) {
  if (payload.action.key === 'edit') {
    openEdit(payload.row)
    return
  }

  if (payload.action.key === 'delete') {
    handleDelete(payload.row)
  }
}

async function handleDelete(row: Banner) {
  try {
    await ElMessageBox.confirm(`确定删除 Banner《${row.title}》吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await bannerApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchBanners()
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload: BannerPayload) {
  const isCreate = dialogMode.value === 'create'

  submitLoading.value = true
  try {
    if (isCreate) {
      await bannerApi.create(payload)
      ElMessage.success('新增成功')
    } else if (currentBanner.value) {
      await bannerApi.update(currentBanner.value.id, payload)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    await fetchBanners()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchBanners()
})

watch(
  [() => tableData.value, canDragSort],
  () => {
    syncSortable()
  },
  {
    flush: 'post',
  },
)

onBeforeUnmount(() => {
  destroySortable()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch v-model="search" :fields="searchFields" @search="handleSearch" />

      <EsListToolbar>
        <template #actions>
          <ElButton v-auth="BANNER_PERMISSIONS.create" type="primary" plain @click="handleAdd">
            新增 Banner
          </ElButton>
        </template>
      </EsListToolbar>

      <ElAlert
        v-if="!isDefaultSearchCondition"
        title="当前列表已筛选，请清空筛选条件后再拖拽排序。"
        type="info"
        :closable="false"
        class="mb-4"
      />

      <div ref="tableWrapperRef" class="table-wrapper">
        <EsTable
          :columns="BANNER_TABLE_COLUMNS"
          :data="tableData"
          :loading="tableLoading"
          :show-pagination="false"
          row-key="id"
          table-height="100%"
          @action-click="handleTableAction"
        >
          <template #dragSort>
            <div
              class="banner-drag-handle inline-flex items-center gap-1"
              :class="
                canDragSort ? 'cursor-move text-stone-500' : 'cursor-not-allowed text-stone-300'
              "
            >
              <FaIcon name="i-ep:rank" class="size-4" />
              <span class="text-xs">拖拽</span>
            </div>
          </template>
          <template #imageUrl="{ row }">
            <div class="my-6px flex items-center">
              <ImagePreview :src="row.imageUrl" :width="104" :height="54" />
            </div>
          </template>
          <template #jumpType="{ row }">
            {{ getBannerJumpTypeLabel(row.jumpType) }}
          </template>
          <template #subtitle="{ row }">
            {{ row.subtitle || '-' }}
          </template>
          <template #jumpUrl="{ row }">
            <ElLink
              v-if="row.jumpType === 'webview' && row.jumpUrl"
              :href="row.jumpUrl"
              target="_blank"
              type="primary"
            >
              {{ row.jumpUrl }}
            </ElLink>
            <span v-else-if="row.jumpUrl">{{ row.jumpUrl }}</span>
            <span v-else>-</span>
          </template>
          <template #status="{ row }">
            <ElTag :type="getBannerStatusTagType(row.status)" effect="plain">
              {{ getBannerStatusLabel(row.status) }}
            </ElTag>
          </template>
          <template #updatedAt="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </EsTable>
      </div>
    </FaPageMain>

    <BannerFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :banner="currentBanner"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.table-wrapper :deep(.banner-sort-ghost > td) {
  background: rgb(245 245 244);
}

.table-wrapper :deep(.banner-sort-chosen > td) {
  background: rgb(250 250 249);
}
</style>
