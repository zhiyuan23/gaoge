<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { Player, PlayerPayload } from '@/api/football/player'
import playersApi from '@/api/football/player'
import teamsApi from '@/api/football/team'
import type { SearchFormData, SearchOption } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import PlayerFormDialog from './components/PlayerFormDialog.vue'
import { PLAYER_DEFAULT_SEARCH } from './model/defaults'
import { buildPlayerListParams } from './model/mapper'
import type { PlayerSearch } from './model/types'
import { getFootballPositionLabel, PLAYER_POSITION_OPTIONS } from './schemas/form'
import { createPlayerSearchFields, mergePlayerStatusOptions } from './schemas/search'
import { formatDateTime, PLAYER_TABLE_COLUMNS } from './schemas/table'
import { PLAYER_PERMISSIONS } from './auth'

defineOptions({
  name: 'GaogePlayer',
})

const submitLoading = ref(false)
const selectionDataList = ref<Player[]>([])
const teamOptions = ref<SearchOption[]>([])

const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList: fetchPlayers,
  handleSearch,
  handlePaginationChange,
} = useListPage<PlayerSearch, Player, ReturnType<typeof buildPlayerListParams>>({
  defaultSearch: PLAYER_DEFAULT_SEARCH,
  buildParams: buildPlayerListParams,
  request: playersApi.list,
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
      teamId: typeof formData.teamId === 'number' ? formData.teamId : '',
      position: String(formData.position ?? '') as PlayerSearch['position'],
    }
  },
})

const {
  dialogVisible,
  dialogMode,
  currentRow: currentPlayer,
  openCreate,
  openEdit,
} = useCrudDialog<Player>()

const positionOptions = computed<SearchOption[]>(() => PLAYER_POSITION_OPTIONS)
const statusOptions = computed(() => {
  return mergePlayerStatusOptions(
    Array.from(new Set(tableData.value.map((item) => item.status))).map((value) => ({
      label: value,
      value,
    })),
  )
})

const searchFields = computed(() =>
  createPlayerSearchFields({
    teamOptions: () => teamOptions.value,
  }),
)

async function fetchTeamOptions() {
  const { list } = await teamsApi.list({ page: 1, pageSize: 100 })

  teamOptions.value = list.map((team) => ({
    label: team.name,
    value: team.id,
  }))
}

function handleAdd() {
  openCreate()
}

function handleEdit(row: Player) {
  openEdit(row)
}

function handleTableAction(payload: { row: Player; action: { key: string } }) {
  if (payload.action.key === 'edit') {
    handleEdit(payload.row)
    return
  }

  if (payload.action.key === 'delete') {
    handleDelete(payload.row)
  }
}

function handleSelectionChange(rows: Player[]) {
  selectionDataList.value = rows
}

function formatTeamNames(row: Player) {
  return row.teams.length ? row.teams.map((team) => team.name).join('、') : '-'
}

function formatPositionNames(row: Player) {
  return row.positions.length
    ? row.positions.map((position) => getFootballPositionLabel(position)).join('、')
    : '-'
}

async function handleDelete(row: Player) {
  try {
    await ElMessageBox.confirm(`确定删除球员 ${row.nickname} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await playersApi.remove(row.id)
    ElMessage.success('已删除')
    await fetchPlayers()
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload: PlayerPayload) {
  const isCreate = dialogMode.value === 'create'

  submitLoading.value = true
  try {
    if (isCreate) {
      await playersApi.create(payload)
      ElMessage.success('新增成功')
    } else if (currentPlayer.value) {
      await playersApi.update(currentPlayer.value.id, payload)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await fetchPlayers()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  fetchPlayers()
  fetchTeamOptions()
})

watch(tableData, () => {
  selectionDataList.value = []
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch v-model="search" :fields="searchFields" @search="handleSearch"> </EsSearch>

      <EsListToolbar>
        <template #actions>
          <ElButton v-auth="PLAYER_PERMISSIONS.create" type="primary" plain @click="handleAdd">
            新增球员
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="PLAYER_TABLE_COLUMNS"
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
              {{ (row.nickname || '?').slice(0, 1) }}
            </ElAvatar>
          </template>
          <template #superheroName="{ row }">
            {{ row.superheroName || '-' }}
          </template>
          <template #teams="{ row }">
            {{ formatTeamNames(row) }}
          </template>
          <template #primaryTeam="{ row }">
            {{ row.primaryTeam?.name ?? '无主队' }}
          </template>
          <template #positions="{ row }">
            {{ formatPositionNames(row) }}
          </template>
          <template #primaryPosition="{ row }">
            {{ row.primaryPosition ? getFootballPositionLabel(row.primaryPosition) : '无主位置' }}
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

    <PlayerFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :player="currentPlayer"
      :team-options="teamOptions"
      :position-options="positionOptions"
      :status-options="statusOptions"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>
