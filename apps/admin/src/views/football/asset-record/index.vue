<route lang="yaml">
meta:
  title: 资产信息
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

import type {
  AssetRecord,
  AssetRecordDirection,
  AssetRecordPayload,
} from '@/api/football/asset-record'
import assetRecordsApi from '@/api/football/asset-record'
import type { SearchFormData } from '@/components/common/EsSearch/types'
import type { EsSummaryCardItem } from '@/components/common/EsSummaryCards/types'
import { useCrudDialog } from '@/composables/useCrudDialog'
import { useListPage } from '@/composables/useListPage'

import AssetRecordFormDialog from './components/AssetRecordFormDialog.vue'
import { ASSET_RECORD_DEFAULT_SEARCH, createEmptyAssetRecordSummary } from './model/defaults'
import { buildAssetRecordListParams } from './model/mapper'
import type { AssetRecordSearch, AssetRecordSummaryModel } from './model/types'
import {
  getAssetRecordDirectionLabel,
  getAssetRecordDirectionTagType,
  getAssetRecordStatusLabel,
  getAssetRecordStatusTagType,
  getAssetRecordTypeLabel,
} from './schemas/form'
import { createAssetRecordSearchFields } from './schemas/search'
import {
  ASSET_RECORD_TABLE_COLUMNS,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatSignedCurrency,
} from './schemas/table'
import { ASSET_RECORD_PERMISSIONS } from './auth'

defineOptions({
  name: 'GaogeAssetRecord',
})

const submitLoading = ref(false)
const selectionDataList = ref<AssetRecord[]>([])
const createDirection = ref<AssetRecordDirection>('income')
const summary = ref<AssetRecordSummaryModel>(createEmptyAssetRecordSummary())

const {
  search,
  tableData,
  total,
  loading,
  page,
  pageSize,
  fetchList: fetchAssetRecords,
  handleSearch,
  handlePaginationChange,
} = useListPage<AssetRecordSearch, AssetRecord, ReturnType<typeof buildAssetRecordListParams>>({
  defaultSearch: ASSET_RECORD_DEFAULT_SEARCH,
  buildParams: buildAssetRecordListParams,
  request: assetRecordsApi.list,
  normalizeSearch(formData: SearchFormData) {
    return {
      keyword: String(formData.keyword ?? ''),
      direction: (formData.direction as AssetRecordDirection | '') || '',
      recordType: formData.recordType || '',
      status: formData.status || '',
      dateRange: Array.isArray(formData.dateRange) ? formData.dateRange : [],
    }
  },
})

const {
  dialogVisible,
  dialogMode,
  currentRow: currentAssetRecord,
  openCreate,
  openEdit,
} = useCrudDialog<AssetRecord>()

const searchFields = computed(() => createAssetRecordSearchFields())
const summaryCards = computed<EsSummaryCardItem[]>(() => [
  {
    key: 'income',
    label: '总收入',
    value: formatCurrency(summary.value.totalIncome),
    badge: '入',
    color: 'emerald',
  },
  {
    key: 'expense',
    label: '总支出',
    value: formatCurrency(summary.value.totalExpense),
    badge: '出',
    color: 'rose',
  },
  {
    key: 'balance',
    label: '当前结余',
    value: formatCurrency(summary.value.balance),
    badge: '余',
    color: 'sky',
  },
])

async function fetchSummary() {
  summary.value = await assetRecordsApi.summary()
}

function handleAdd(direction: AssetRecordDirection) {
  createDirection.value = direction
  openCreate()
}

function handleEdit(row: AssetRecord) {
  openEdit(row)
}

function handleTableAction(payload: { row: AssetRecord; action: { key: string } }) {
  if (payload.action.key === 'edit') {
    handleEdit(payload.row)
    return
  }

  if (payload.action.key === 'delete') {
    handleDelete(payload.row)
  }
}

function handleSelectionChange(rows: AssetRecord[]) {
  selectionDataList.value = rows
}

async function handleDelete(row: AssetRecord) {
  try {
    await ElMessageBox.confirm(`确定删除资产记录 ${row.title} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    loading.value = true
    await assetRecordsApi.remove(row.id)
    ElMessage.success('已删除')
    await Promise.all([fetchAssetRecords(), fetchSummary()])
  } finally {
    loading.value = false
  }
}

async function handleSubmit(payload: AssetRecordPayload) {
  const isCreate = dialogMode.value === 'create'

  submitLoading.value = true
  try {
    if (isCreate) {
      await assetRecordsApi.create(payload)
      ElMessage.success('新增成功')
    } else if (currentAssetRecord.value) {
      await assetRecordsApi.update(currentAssetRecord.value.id, payload)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await Promise.all([fetchAssetRecords(), fetchSummary()])
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAssetRecords(), fetchSummary()])
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
        :default-visible-count="2"
        @search="handleSearch"
      />

      <EsSummaryCards :items="summaryCards" />

      <EsListToolbar :selected-count="selectionDataList.length">
        <template #actions>
          <ElButton
            v-auth="ASSET_RECORD_PERMISSIONS.create"
            type="primary"
            plain
            @click="handleAdd('income')"
          >
            新增收入
          </ElButton>
          <ElButton
            v-auth="ASSET_RECORD_PERMISSIONS.create"
            type="danger"
            plain
            @click="handleAdd('expense')"
          >
            新增支出
          </ElButton>
        </template>
      </EsListToolbar>

      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="ASSET_RECORD_TABLE_COLUMNS"
          :data="tableData"
          :total="total"
          :loading="loading"
          table-height="100%"
          @action-click="handleTableAction"
          @pagination-change="handlePaginationChange"
          @selection-change="handleSelectionChange"
        >
          <template #recordDate="{ row }">
            {{ formatDate(row.recordDate) }}
          </template>
          <template #direction="{ row }">
            <ElTag :type="getAssetRecordDirectionTagType(row.direction)">
              {{ getAssetRecordDirectionLabel(row.direction) }}
            </ElTag>
          </template>
          <template #recordType="{ row }">
            {{ getAssetRecordTypeLabel(row.recordType) }}
          </template>
          <template #amount="{ row }">
            <span
              :class="
                row.direction === 'income'
                  ? 'font-semibold text-emerald-600 dark:text-emerald-300'
                  : 'font-semibold text-rose-600 dark:text-rose-300'
              "
            >
              {{
                row.isWaived
                  ? formatCurrency(row.amount)
                  : formatSignedCurrency(row.direction, row.amount)
              }}
            </span>
          </template>
          <template #status="{ row }">
            <ElTag :type="getAssetRecordStatusTagType(row.status)">
              {{
                row.isWaived && row.status === 'confirmed'
                  ? '免收'
                  : getAssetRecordStatusLabel(row.status)
              }}
            </ElTag>
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

    <AssetRecordFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :asset-record="currentAssetRecord"
      :initial-direction="createDirection"
      :loading="submitLoading"
      @submit="handleSubmit"
    />
  </div>
</template>
