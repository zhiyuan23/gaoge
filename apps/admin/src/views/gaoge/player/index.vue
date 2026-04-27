<route lang="yaml">
meta:
  title: 球员信息
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type { Player, PlayerListParams, PlayerPayload } from '@/api/players'
import playersApi from '@/api/players'
import type { SearchFormData, SearchOption } from '@/components/common/EsSearch/types'

import { usePlayerAuth } from './auth'
import {
  createPlayerSearchFields,
  PLAYER_DEFAULT_SEARCH,
  PLAYER_STATUS_OPTIONS,
  PLAYER_TABLE_COLUMNS,
  type PlayerSearch,
} from './constants'
import {
  formatBirthDate,
  formatDateTime,
  getPlayerStatusLabel,
  getPlayerStatusTagType,
} from './formatters'
import PlayerFormDialog from './PlayerFormDialog.vue'

defineOptions({
  name: 'GaogePlayer',
})

const { canCreatePlayer, canUpdatePlayer, canDeletePlayer } = usePlayerAuth()

const search = ref<PlayerSearch>({ ...PLAYER_DEFAULT_SEARCH })
const tableData = ref<Player[]>([])
const total = ref(0)
const loading = ref(false)
const submitLoading = ref(false)
const page = ref(1)
const pageSize = ref(15)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const currentPlayer = ref<Player | null>(null)

const subTeamOptions = computed(() => createOptions(tableData.value.map((item) => item.subTeam)))
const positionOptions = computed(() => createOptions(tableData.value.map((item) => item.position)))
const statusOptions = computed(() => {
  const dynamicOptions = createOptions(tableData.value.map((item) => item.status))
  const options = [...PLAYER_STATUS_OPTIONS]
  dynamicOptions.forEach((item) => {
    if (!options.some((option) => option.value === item.value)) {
      options.push(item)
    }
  })
  return options
})

const searchFields = computed(() =>
  createPlayerSearchFields({
    subTeamOptions: () => subTeamOptions.value,
    positionOptions: () => positionOptions.value,
    statusOptions: () => statusOptions.value,
  }),
)

// 当前页数据用于生成筛选下拉选项，后续可替换为独立字典接口。
function createOptions(values: Array<string | null | undefined>): SearchOption[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim()))),
  ).map((value) => ({
    label: value,
    value,
  }))
}

// 列表请求参数统一从页面状态生成，保证搜索和分页使用同一套条件。
function buildListParams(): PlayerListParams {
  return {
    page: page.value,
    pageSize: pageSize.value,
    keyword: search.value.keyword || undefined,
    subTeam: search.value.subTeam || undefined,
    position: search.value.position || undefined,
    status: search.value.status || undefined,
  }
}

// 服务端分页后，当前页被删空时自动回退到最后一页。
async function fetchPlayers() {
  loading.value = true
  try {
    const res = await playersApi.list(buildListParams())
    tableData.value = res.list
    total.value = res.total
    if (page.value > 1 && tableData.value.length === 0 && total.value > 0) {
      page.value = Math.max(1, Math.ceil(total.value / pageSize.value))
      await fetchPlayers()
    }
  } finally {
    loading.value = false
  }
}

// 搜索条件变更时回到第一页，这是后台列表页的默认交互。
function handleSearch(formData: SearchFormData) {
  search.value = {
    keyword: String(formData.keyword ?? ''),
    subTeam: String(formData.subTeam ?? ''),
    position: String(formData.position ?? ''),
    status: String(formData.status ?? ''),
  }
  page.value = 1
  fetchPlayers()
}

function handlePaginationChange(params: { page: number; pageSize: number }) {
  page.value = params.page
  pageSize.value = params.pageSize
  fetchPlayers()
}

function handleAdd() {
  if (!canCreatePlayer.value) {
    ElMessage.warning('当前账号没有新增球员权限')
    return
  }
  dialogMode.value = 'create'
  currentPlayer.value = null
  dialogVisible.value = true
}

function handleEdit(row: Player) {
  if (!canUpdatePlayer.value) {
    ElMessage.warning('当前账号没有编辑球员权限')
    return
  }
  dialogMode.value = 'edit'
  currentPlayer.value = row
  dialogVisible.value = true
}

async function handleDelete(row: Player) {
  if (!canDeletePlayer.value) {
    ElMessage.warning('当前账号没有删除球员权限')
    return
  }
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
  if (isCreate && !canCreatePlayer.value) {
    ElMessage.warning('当前账号没有新增球员权限')
    return
  }
  if (!isCreate && !canUpdatePlayer.value) {
    ElMessage.warning('当前账号没有编辑球员权限')
    return
  }

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
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <FaSearchBar>
        <template #default>
          <EsSearch
            v-model="search"
            :fields="searchFields"
            :columns="4"
            :label-width="72"
            :default-visible-count="4"
            :show-collapse="false"
            @search="handleSearch"
          >
            <template #actions>
              <ElButton v-if="canCreatePlayer" type="primary" plain @click="handleAdd">
                新增球员
              </ElButton>
            </template>
          </EsSearch>
        </template>
      </FaSearchBar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="PLAYER_TABLE_COLUMNS"
          :data="tableData"
          :total="total"
          :loading="loading"
          :show-index="true"
          table-height="100%"
          @pagination-change="handlePaginationChange"
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
          <template #actions="{ row }">
            <div class="flex-center gap-2">
              <ElButton v-if="canUpdatePlayer" type="primary" link @click="handleEdit(row)">
                编辑
              </ElButton>
              <ElButton v-if="canDeletePlayer" type="danger" link @click="handleDelete(row)">
                删除
              </ElButton>
            </div>
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
