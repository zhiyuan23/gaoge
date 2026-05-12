<route lang="yaml">
meta:
  title: 球队信息
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { Team, TeamPayload } from '@/api/basketball/team'
import teamsApi from '@/api/basketball/team'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import TeamFormDialog from './components/TeamFormDialog.vue'
import { TEAM_DEFAULT_SEARCH } from './model/defaults'
import { buildTeamListParams } from './model/mapper'
import type { TeamSearch } from './model/types'
import { createTeamSearchFields } from './schemas/search'
import { formatDateTime, TEAM_TABLE_COLUMNS } from './schemas/table'
import { TEAM_PERMISSIONS } from './auth'

defineOptions({
  name: 'BasketballTeamPage',
})

const submitLoading = ref(false)
const selectionDataList = ref<Team[]>([])

const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList: fetchTeams,
  handleSearch,
  handlePaginationChange,
} = useListPage<TeamSearch, Team, ReturnType<typeof buildTeamListParams>>({
  defaultSearch: TEAM_DEFAULT_SEARCH,
  buildParams: buildTeamListParams,
  request: teamsApi.list,
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
    }
  },
})

const {
  dialogVisible,
  dialogMode,
  currentRow: currentTeam,
  openCreate,
  openEdit,
} = useCrudDialog<Team>()

const searchFields = computed(() => createTeamSearchFields())

function handleAdd() {
  openCreate()
}

function handleEdit(row: Team) {
  openEdit(row)
}

function handleTableAction(payload: { row: Team; action: { key: string } }) {
  if (payload.action.key === 'edit') {
    handleEdit(payload.row)
    return
  }

  if (payload.action.key === 'delete') {
    handleDelete(payload.row)
  }
}

function handleSelectionChange(rows: Team[]) {
  selectionDataList.value = rows
}

async function handleDelete(row: Team) {
  try {
    await ElMessageBox.confirm(`确定删除球队 ${row.name} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await teamsApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchTeams()
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload: TeamPayload) {
  const isCreate = dialogMode.value === 'create'

  submitLoading.value = true
  try {
    if (isCreate) {
      await teamsApi.create(payload)
      ElMessage.success('新增成功')
    } else if (currentTeam.value) {
      await teamsApi.update(currentTeam.value.id, payload)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await fetchTeams()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchTeams()
})

watch(tableData, () => {
  selectionDataList.value = []
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch
        v-model="search"
        :fields="searchFields"
        :default-visible-count="1"
        @search="handleSearch"
      >
      </EsSearch>

      <EsListToolbar :selected-count="selectionDataList.length">
        <template #actions>
          <ElButton v-auth="TEAM_PERMISSIONS.create" type="primary" plain @click="handleAdd">
            新增球队
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="TEAM_TABLE_COLUMNS"
          :data="tableData"
          :total="total"
          :loading="loading"
          table-height="100%"
          @action-click="handleTableAction"
          @pagination-change="handlePaginationChange"
          @selection-change="handleSelectionChange"
        >
          <template #avatar="{ row }">
            <ElAvatar :src="row.avatarUrl || undefined" :size="32">
              {{ (row.name || '?').slice(0, 1) }}
            </ElAvatar>
          </template>
          <template #createdAt="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
          <template #updatedAt="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </EsTable>
      </div>
    </FaPageMain>

    <TeamFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :team="currentTeam"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>
