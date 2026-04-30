<route lang="yaml">
meta:
  title: 比赛信息
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { MatchRound, MatchRoundPayload, UpdateMatchRoundPayload } from '@/api/match-rounds'
import matchRoundsApi from '@/api/match-rounds'
import type { Team } from '@/api/teams'
import teamsApi from '@/api/teams'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import MatchRoundFormDialog from './components/MatchRoundFormDialog.vue'
import { MATCH_ROUND_DEFAULT_SEARCH } from './model/defaults'
import { buildMatchRoundListParams } from './model/mapper'
import type { MatchRoundSearch } from './model/types'
import { createMatchRoundSearchFields } from './schemas/search'
import {
  formatDateTime,
  formatMatchDate,
  formatResultSummary,
  MATCH_ROUND_TABLE_COLUMNS,
} from './schemas/table'
import { MATCH_ROUND_PERMISSIONS } from './auth'

defineOptions({
  name: 'GaogeMatchRound',
})

const submitLoading = ref(false)
const selectionDataList = ref<MatchRound[]>([])
const teams = ref<Team[]>([])
const teamsTotal = ref(0)
const teamsLoading = ref(false)

const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList: fetchMatchRounds,
  handleSearch,
  handlePaginationChange,
} = useListPage<MatchRoundSearch, MatchRound, ReturnType<typeof buildMatchRoundListParams>>({
  defaultSearch: MATCH_ROUND_DEFAULT_SEARCH,
  buildParams: buildMatchRoundListParams,
  request: matchRoundsApi.list,
  normalizeSearch(formData: SearchFormData) {
    return {
      matchDate: String(formData.matchDate ?? ''),
      venueKeyword: String(formData.venueKeyword ?? ''),
    }
  },
})

const {
  dialogVisible,
  dialogMode,
  currentRow: currentMatchRound,
  openCreate,
  openEdit,
} = useCrudDialog<MatchRound>()

const searchFields = computed(() => createMatchRoundSearchFields())
const teamsValid = computed(() => teamsTotal.value === 3)
const teamsWarning = computed(() =>
  teamsTotal.value === 3
    ? ''
    : `当前球队数量为 ${teamsTotal.value}，业务要求必须恰好有 3 支球队后才能维护比赛信息。`,
)

function handleAdd() {
  if (!teamsValid.value) {
    ElMessage.error(teamsWarning.value)
    return
  }

  openCreate()
}

function handleEdit(row: MatchRound) {
  openEdit(row)
}

function handleTableAction(payload: { row: MatchRound; action: { key: string } }) {
  if (payload.action.key === 'edit') {
    handleEdit(payload.row)
    return
  }

  if (payload.action.key === 'delete') {
    handleDelete(payload.row)
  }
}

function handleSelectionChange(rows: MatchRound[]) {
  selectionDataList.value = rows
}

async function fetchTeams() {
  teamsLoading.value = true
  try {
    const response = await teamsApi.list({ page: 1, pageSize: 100 })
    teams.value = response.list
    teamsTotal.value = response.total
  } finally {
    teamsLoading.value = false
  }
}

async function handleDelete(row: MatchRound) {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${formatMatchDate(row.matchDate)} 的比赛信息吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
    loading.value = true
    await matchRoundsApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchMatchRounds()
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload: MatchRoundPayload | UpdateMatchRoundPayload) {
  const isCreate = dialogMode.value === 'create'

  submitLoading.value = true
  try {
    if (isCreate) {
      await matchRoundsApi.create(payload as MatchRoundPayload)
      ElMessage.success('新增成功')
    } else if (currentMatchRound.value) {
      await matchRoundsApi.update(currentMatchRound.value.id, payload as UpdateMatchRoundPayload)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    await fetchMatchRounds()
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchTeams(), fetchMatchRounds()])
})

watch(tableData, () => {
  selectionDataList.value = []
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <ElAlert
        v-if="!teamsLoading && !teamsValid"
        :title="teamsWarning"
        type="error"
        show-icon
        class="mb-4"
      />

      <EsSearch
        v-model="search"
        :fields="searchFields"
        :columns="4"
        :default-visible-count="2"
        @search="handleSearch"
      >
      </EsSearch>

      <EsListToolbar :selected-count="selectionDataList.length">
        <template #actions>
          <ElButton
            v-auth="MATCH_ROUND_PERMISSIONS.create"
            type="primary"
            plain
            :disabled="!teamsValid"
            @click="handleAdd"
          >
            新增比赛
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="MATCH_ROUND_TABLE_COLUMNS"
          :data="tableData"
          :total="total"
          :loading="loading"
          table-height="100%"
          @action-click="handleTableAction"
          @pagination-change="handlePaginationChange"
          @selection-change="handleSelectionChange"
        >
          <template #matchDate="{ row }">
            {{ formatMatchDate(row.matchDate) }}
          </template>
          <template #resultSummary="{ row }">
            {{ formatResultSummary(row) }}
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

    <MatchRoundFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :match-round="currentMatchRound"
      :teams="teams"
      :teams-valid="teamsValid"
      :teams-warning="teamsWarning"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>

<style scoped>
.absolute-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  margin-top: 16px;
}
</style>
