<route lang="yaml">
meta:
  title: 留言板
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { MessageBoardPost, MessageBoardPostPayload } from '@/api/content/message-board-post'
import messageBoardPostApi from '@/api/content/message-board-post'
import type { SearchFormData, SearchOption } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import MessageBoardPostFormDialog from './components/MessageBoardPostFormDialog.vue'
import { MESSAGE_BOARD_POST_DEFAULT_SEARCH } from './model/defaults'
import { buildMessageBoardPostListParams } from './model/mapper'
import type { MessageBoardPostSearch } from './model/types'
import { getMessageBoardPostStatusLabel, getMessageBoardPostStatusTagType } from './schemas/form'
import { createMessageBoardPostSearchFields } from './schemas/search'
import { formatDateTime, MESSAGE_BOARD_POST_TABLE_COLUMNS } from './schemas/table'
import { MESSAGE_BOARD_POST_PERMISSIONS } from './auth'

defineOptions({
  name: 'ContentMessageBoardPost',
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
  fetchList: fetchPosts,
  handleSearch,
  handlePaginationChange,
} = useListPage<
  MessageBoardPostSearch,
  MessageBoardPost,
  ReturnType<typeof buildMessageBoardPostListParams>
>({
  defaultSearch: MESSAGE_BOARD_POST_DEFAULT_SEARCH,
  buildParams: buildMessageBoardPostListParams,
  request: async (params) => {
    const response = await messageBoardPostApi.list(params)
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
} = useCrudDialog<MessageBoardPost>()

const searchFields = computed(() =>
  createMessageBoardPostSearchFields({
    tagOptions: () => tagOptions.value,
  }),
)

function handleAdd() {
  openCreate()
}

function handleEdit(row: MessageBoardPost) {
  openEdit(row)
}

function handleTableAction(payload: { row: MessageBoardPost; action: { key: string } }) {
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

async function handleDelete(row: MessageBoardPost) {
  try {
    await ElMessageBox.confirm(`确定删除留言板消息《${row.title}》吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await messageBoardPostApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchPosts()
  } finally {
    loading.value = false
  }
}

async function handlePublish(row: MessageBoardPost) {
  try {
    await ElMessageBox.confirm(`确定发布留言板消息《${row.title}》吗？`, '发布确认', {
      type: 'info',
      confirmButtonText: '发布',
      cancelButtonText: '取消',
    })
    loading.value = true
    await messageBoardPostApi.publish(row.id)
    ElMessage.success('发布成功')
    await fetchPosts()
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload: {
  data: MessageBoardPostPayload
  action: 'draft' | 'publish' | 'save'
}) {
  const isCreate = dialogMode.value === 'create'

  submitLoading.value = true
  try {
    if (isCreate) {
      await messageBoardPostApi.create({
        ...payload.data,
        status: payload.action === 'publish' ? 'published' : 'draft',
      })
      ElMessage.success(payload.action === 'publish' ? '发布成功' : '草稿已保存')
    } else if (currentPost.value) {
      if (currentPost.value.status === 'draft' && payload.action === 'publish') {
        await messageBoardPostApi.update(currentPost.value.id, {
          ...payload.data,
          status: 'draft',
        })
        await messageBoardPostApi.publish(currentPost.value.id)
        ElMessage.success('发布成功')
      } else {
        await messageBoardPostApi.update(currentPost.value.id, {
          ...payload.data,
          status: currentPost.value.status === 'published' ? 'published' : 'draft',
        })
        ElMessage.success('保存成功')
      }
    }

    dialogVisible.value = false
    await fetchPosts()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch v-model="search" :fields="searchFields" @search="handleSearch" />

      <EsListToolbar>
        <template #actions>
          <ElButton
            v-auth="MESSAGE_BOARD_POST_PERMISSIONS.create"
            type="primary"
            plain
            @click="handleAdd"
          >
            新增留言
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="MESSAGE_BOARD_POST_TABLE_COLUMNS"
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
            <ElTag :type="getMessageBoardPostStatusTagType(row.status)" size="small">
              {{ getMessageBoardPostStatusLabel(row.status) }}
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

    <MessageBoardPostFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :post="currentPost"
      :tag-options="tagOptions"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>
