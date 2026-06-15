<route lang="yaml">
meta:
  title: Banner 管理
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { Banner, BannerPayload } from '@/api/content/banner'
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

const searchFields = computed(() => createBannerSearchFields())

const {
  search,
  tableData,
  loading,
  fetchList: fetchBanners,
  handleSearch,
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

      <div class="table-wrapper">
        <EsTable
          :columns="BANNER_TABLE_COLUMNS"
          :data="tableData"
          :loading="loading"
          :show-pagination="false"
          table-height="100%"
          @action-click="handleTableAction"
        >
          <template #imageUrl="{ row }">
            <ImagePreview :src="row.imageUrl" :width="96" :height="54" />
          </template>
          <template #jumpType="{ row }">
            {{ getBannerJumpTypeLabel(row.jumpType) }}
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
