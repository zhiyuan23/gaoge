<route lang="yaml">
meta:
  title: 流言板
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { RumorPost, RumorPostPayload } from '@/api/content/rumor-post'
import rumorPostApi from '@/api/content/rumor-post'
import type { SearchFormData, SearchOption } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import RumorPostFormDialog from './components/RumorPostFormDialog.vue'
import { RUMOR_POST_DEFAULT_SEARCH } from './model/defaults'
import { buildRumorPostListParams } from './model/mapper'
import type { RumorPostSearch } from './model/types'
import { getRumorPostStatusLabel, getRumorPostStatusTagType } from './schemas/form'
import { createRumorPostSearchFields } from './schemas/search'
import { formatDateTime, RUMOR_POST_TABLE_COLUMNS } from './schemas/table'
import { RUMOR_POST_PERMISSIONS } from './auth'

defineOptions({
  name: 'ContentRumorPost',
})

const submitLoading = ref(false)
const tagOptions = ref<SearchOption[]>([])

const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList: fetchRumorPosts,
  handleSearch,
  handlePaginationChange,
} = useListPage<RumorPostSearch, RumorPost, ReturnType<typeof buildRumorPostListParams>>({
  defaultSearch: RUMOR_POST_DEFAULT_SEARCH,
  buildParams: buildRumorPostListParams,
  request: async (params) => {
    const response = await rumorPostApi.list(params)
    tagOptions.value = response.tagOptions
    return response
  },
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
      status: String(formData.status ?? ''),
      tag: String(formData.tag ?? ''),
    }
  },
})

const {
  dialogVisible,
  dialogMode,
  currentRow: currentPost,
  openCreate,
  openEdit,
} = useCrudDialog<RumorPost>()

const searchFields = computed(() =>
  createRumorPostSearchFields({
    tagOptions: () => tagOptions.value,
  }),
)

function handleAdd() {
  openCreate()
}

function handleEdit(row: RumorPost) {
  openEdit(row)
}

function handleTableAction(payload: { row: RumorPost; action: { key: string } }) {
  if (payload.action.key === 'edit') {
    handleEdit(payload.row)
    return
  }

  if (payload.action.key === 'publish') {
    handlePublish(payload.row)
    return
  }

  if (payload.action.key === 'delete') {
    handleDelete(payload.row)
  }
}

async function handleDelete(row: RumorPost) {
  try {
    await ElMessageBox.confirm(`确定删除流言动态《${row.title}》吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await rumorPostApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchRumorPosts()
  } finally {
    loading.value = false
  }
}

async function handlePublish(row: RumorPost) {
  try {
    await ElMessageBox.confirm(`确定发布流言动态《${row.title}》吗？`, '发布确认', {
      type: 'info',
      confirmButtonText: '发布',
      cancelButtonText: '取消',
    })
    loading.value = true
    await rumorPostApi.publish(row.id)
    ElMessage.success('发布成功')
    await fetchRumorPosts()
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload: {
  data: RumorPostPayload
  action: 'draft' | 'publish' | 'save'
}) {
  const isCreate = dialogMode.value === 'create'

  submitLoading.value = true
  try {
    if (isCreate) {
      await rumorPostApi.create({
        ...payload.data,
        status: payload.action === 'publish' ? 'published' : 'draft',
      })
      ElMessage.success(payload.action === 'publish' ? '发布成功' : '草稿已保存')
    } else if (currentPost.value) {
      if (currentPost.value.status === 'draft' && payload.action === 'publish') {
        await rumorPostApi.update(currentPost.value.id, {
          ...payload.data,
          status: 'draft',
        })
        await rumorPostApi.publish(currentPost.value.id)
        ElMessage.success('发布成功')
      } else {
        await rumorPostApi.update(currentPost.value.id, {
          ...payload.data,
          status: currentPost.value.status === 'published' ? 'published' : 'draft',
        })
        ElMessage.success('保存成功')
      }
    }

    dialogVisible.value = false
    await fetchRumorPosts()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchRumorPosts()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch v-model="search" :fields="searchFields" @search="handleSearch" />

      <EsListToolbar>
        <template #actions>
          <ElButton v-auth="RUMOR_POST_PERMISSIONS.create" type="primary" plain @click="handleAdd">
            新增动态
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="RUMOR_POST_TABLE_COLUMNS"
          :data="tableData"
          :total="total"
          :loading="loading"
          table-height="100%"
          @action-click="handleTableAction"
          @pagination-change="handlePaginationChange"
        >
          <template #tags="{ row }">
            <div class="flex items-center gap-6 overflow-hidden">
              <ElTag v-for="tag in row.tags" :key="tag" size="small" effect="plain">
                {{ tag }}
              </ElTag>
              <span v-if="!row.tags?.length">-</span>
            </div>
          </template>
          <template #sourceName="{ row }">
            <ElLink
              v-if="row.sourceUrl"
              :href="row.sourceUrl"
              target="_blank"
              type="primary"
              underline="never"
            >
              {{ row.sourceName }}
            </ElLink>
            <span v-else>{{ row.sourceName }}</span>
          </template>
          <template #status="{ row }">
            <ElTag :type="getRumorPostStatusTagType(row.status)" size="small">
              {{ getRumorPostStatusLabel(row.status) }}
            </ElTag>
          </template>
          <template #isPinned="{ row }">
            <ElTag v-if="row.isPinned" type="warning" size="small">置顶</ElTag>
            <span v-else>-</span>
          </template>
          <template #publishedAt="{ row }">
            {{ formatDateTime(row.publishedAt) }}
          </template>
          <template #updatedAt="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </EsTable>
      </div>
    </FaPageMain>

    <RumorPostFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :post="currentPost"
      :tag-options="tagOptions"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>
