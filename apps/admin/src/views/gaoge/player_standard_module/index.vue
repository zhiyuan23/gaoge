<route lang="yaml">
meta:
  title: 球员标准模块
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { Player, PlayerPayload } from '@/api/players'
import playersApi from '@/api/players'
import EsListToolbar from '@/components/common/EsListToolbar/index.vue'
import EsSearch from '@/components/common/EsSearch/index.vue'
import type { SearchOption } from '@/components/common/EsSearch/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'
import { PLAYER_PERMISSIONS } from '@/views/gaoge/player/auth'
import { PLAYER_DEFAULT_SEARCH } from '@/views/gaoge/player/model/defaults'
import { buildPlayerListParams } from '@/views/gaoge/player/model/mapper'
import type { PlayerSearch } from '@/views/gaoge/player/model/types'
import { getPlayerStatusLabel, getPlayerStatusTagType } from '@/views/gaoge/player/schemas/form'
import {
  createPlayerOptionList,
  createPlayerSearchFields,
  mergePlayerStatusOptions,
} from '@/views/gaoge/player/schemas/search'
import {
  formatBirthDate,
  formatDateTime,
  PLAYER_TABLE_COLUMNS,
} from '@/views/gaoge/player/schemas/table'

import PlayerStandardFormDialog from './components/PlayerStandardFormDialog.vue'
import PlayerStandardFormDrawer from './components/PlayerStandardFormDrawer.vue'

defineOptions({
  name: 'GaogePlayerStandardModule',
})

type FormMode = 'router' | 'modal' | 'drawer'

const tableAutoHeight = ref(false)
const formMode = ref<FormMode>('modal')
const submitLoading = ref(false)
const selectionDataList = ref<Player[]>([])

const { search, tableData, total, loading, page, pageSize, fetchList, handlePaginationChange } =
  useListPage<PlayerSearch, Player, ReturnType<typeof buildPlayerListParams>>({
    defaultSearch: PLAYER_DEFAULT_SEARCH,
    buildParams: buildPlayerListParams,
    request: playersApi.list,
  })

const {
  dialogVisible,
  dialogMode,
  currentRow: currentPlayer,
  openCreate,
  openEdit,
} = useCrudDialog<Player>()

const isRouterMode = computed(() => formMode.value === 'router')
const isModalMode = computed(() => formMode.value === 'modal')
const isDrawerMode = computed(() => formMode.value === 'drawer')

const subTeamOptions = computed<SearchOption[]>(() =>
  createPlayerOptionList(tableData.value.map((item) => item.subTeam)),
)
const positionOptions = computed<SearchOption[]>(() =>
  createPlayerOptionList(tableData.value.map((item) => item.position)),
)
const statusOptions = computed<SearchOption[]>(() =>
  mergePlayerStatusOptions(createPlayerOptionList(tableData.value.map((item) => item.status))),
)
const searchFields = computed(() =>
  createPlayerSearchFields({
    subTeamOptions: () => subTeamOptions.value,
    positionOptions: () => positionOptions.value,
    statusOptions: () => statusOptions.value,
  }),
)

function notifyRouterModeUnavailable() {
  ElMessage.info('router 模式暂未启用，请切换到对话框或抽屉模式')
}

function currentChange(nextPage = 1) {
  page.value = nextPage
  fetchList()
}

function handleAdd() {
  if (isRouterMode.value) {
    notifyRouterModeUnavailable()
    return
  }
  openCreate()
}

function handleEdit(row: Player) {
  if (isRouterMode.value) {
    notifyRouterModeUnavailable()
    return
  }
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

function handleBatchAction(action: 'delete' | 'export') {
  if (!selectionDataList.value.length) {
    ElMessage.warning('请先选择数据')
    return
  }

  const actionLabel = action === 'delete' ? '批量删除' : '批量导出'
  ElMessage.info(`${actionLabel} 暂未启用，当前仅保留标准模块骨架`)
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
    selectionDataList.value = selectionDataList.value.filter((item) => item.id !== row.id)
    await fetchList()
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
    await fetchList()
  } finally {
    submitLoading.value = false
  }
}

watch(tableData, () => {
  selectionDataList.value = []
})

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div :class="{ 'absolute flex size-full flex-col': tableAutoHeight }">
    <FaPageHeader title="球员标准模块" class="mb-0">
      <template #description>
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="shrink-0">列表展示模式</span>
            <div class="flex flex-wrap gap-2">
              <FaButton
                :variant="!tableAutoHeight ? 'default' : 'outline'"
                size="sm"
                @click="tableAutoHeight = false"
              >
                默认
              </FaButton>
              <FaButton
                :variant="tableAutoHeight ? 'default' : 'outline'"
                size="sm"
                @click="tableAutoHeight = true"
              >
                列表高度自适应
              </FaButton>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <span class="shrink-0">表单展示模式</span>
            <div class="flex flex-wrap gap-2">
              <FaButton
                :variant="formMode === 'router' ? 'default' : 'outline'"
                size="sm"
                @click="formMode = 'router'"
              >
                router
              </FaButton>
              <FaButton
                :variant="formMode === 'modal' ? 'default' : 'outline'"
                size="sm"
                @click="formMode = 'modal'"
              >
                modal
              </FaButton>
              <FaButton
                :variant="formMode === 'drawer' ? 'default' : 'outline'"
                size="sm"
                @click="formMode = 'drawer'"
              >
                drawer
              </FaButton>
            </div>
          </div>
        </div>
      </template>
    </FaPageHeader>

    <FaPageMain
      :class="{ 'flex-1 overflow-auto': tableAutoHeight }"
      :main-class="{ 'flex flex-1 flex-col overflow-auto': tableAutoHeight }"
    >
      <EsSearch
        v-model="search"
        :fields="searchFields"
        :default-visible-count="2"
        @search="currentChange()"
      />

      <EsListToolbar :selected-count="selectionDataList.length">
        <template #actions>
          <FaButton
            variant="outline"
            size="sm"
            :disabled="!selectionDataList.length"
            @click="handleBatchAction('delete')"
          >
            批量删除
          </FaButton>
          <FaButton
            variant="outline"
            size="sm"
            :disabled="!selectionDataList.length"
            @click="handleBatchAction('export')"
          >
            批量导出
          </FaButton>
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
          row-key="id"
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

    <PlayerStandardFormDialog
      v-if="isModalMode"
      v-model="dialogVisible"
      :mode="dialogMode"
      :player="currentPlayer"
      :sub-team-options="subTeamOptions"
      :position-options="positionOptions"
      :status-options="statusOptions"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <PlayerStandardFormDrawer
      v-if="isDrawerMode"
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
.table-wrapper {
  flex: 1;
  min-height: 0;
}
</style>
