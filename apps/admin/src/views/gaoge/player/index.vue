<route lang="yaml">
meta:
  title: 球员信息
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { Player, PlayerPayload } from '@/api/players'
import playersApi from '@/api/players'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import PlayerFormDialog from './components/PlayerFormDialog.vue'
import { PLAYER_DEFAULT_SEARCH } from './model/defaults'
import { buildPlayerListParams } from './model/mapper'
import type { PlayerSearch } from './model/types'
import { getPlayerStatusLabel, getPlayerStatusTagType } from './schemas/form'
import {
  createPlayerOptionList,
  createPlayerSearchFields,
  mergePlayerStatusOptions,
} from './schemas/search'
import { formatBirthDate, formatDateTime, PLAYER_TABLE_COLUMNS } from './schemas/table'
import { PLAYER_PERMISSIONS } from './auth'

defineOptions({
  name: 'GaogePlayer',
})

const submitLoading = ref(false)
const selectionDataList = ref<Player[]>([])

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
      subTeam: String(formData.subTeam ?? ''),
      position: String(formData.position ?? ''),
      status: String(formData.status ?? ''),
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

const subTeamOptions = computed(() =>
  createPlayerOptionList(tableData.value.map((item) => item.subTeam)),
)
const positionOptions = computed(() =>
  createPlayerOptionList(tableData.value.map((item) => item.position)),
)
const statusOptions = computed(() => {
  return mergePlayerStatusOptions(
    createPlayerOptionList(tableData.value.map((item) => item.status)),
  )
})

const searchFields = computed(() =>
  createPlayerSearchFields({
    subTeamOptions: () => subTeamOptions.value,
    positionOptions: () => positionOptions.value,
    statusOptions: () => statusOptions.value,
  }),
)

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
        :columns="4"
        :default-visible-count="1"
        @search="handleSearch"
      >
      </EsSearch>

      <EsListToolbar :selected-count="selectionDataList.length">
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
          :show-index="true"
          :show-selection="true"
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
          <template #status="{ row }">
            <ElTag :type="getPlayerStatusTagType(row.status)" effect="light">
              {{ getPlayerStatusLabel(row.status) }}
            </ElTag>
          </template>
          <template #isAdmin="{ row }">
            <ElTag :type="row.isAdmin ? 'danger' : 'info'" effect="light">
              {{ row.isAdmin ? '是' : '否' }}
            </ElTag>
          </template>
          <template #birthDate="{ row }">
            {{ formatBirthDate(row.birthDate) }}
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
      :sub-team-options="subTeamOptions"
      :position-options="positionOptions"
      :status-options="statusOptions"
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
