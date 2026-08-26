<script setup lang="ts">
import type { SystemAuditEvent, SystemAuditListParams } from '@gaoge/shared-types'

import systemAuditApi from '@/api/system/audit'
import type { SearchField } from '@/components/common/EsSearch/types'

import { SYSTEM_AUDIT_TABLE_COLUMNS } from './schemas/table'

import '../system-rbac.css'

defineOptions({ name: 'SystemAudit' })

const events = ref<SystemAuditEvent[]>([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const detail = ref<SystemAuditEvent>()
const detailOpen = ref(false)
const page = ref(1)
const pageSize = ref(50)
const filters = ref({
  action: '',
  entityId: '',
  entityType: '',
  from: '',
  requestId: '',
  result: '',
  to: '',
})
const searchFields: SearchField[] = [
  { key: 'action', label: '操作', type: 'input', placeholder: 'system.user.update' },
  { key: 'result', label: '结果', type: 'input', placeholder: 'SUCCEEDED / DENIED' },
  { key: 'requestId', label: '请求编号', type: 'input' },
  { key: 'entityType', label: '实体类型', type: 'input' },
  { key: 'entityId', label: '实体 ID', type: 'input' },
  { key: 'from', label: '开始时间', type: 'custom', slot: 'from' },
  { key: 'to', label: '结束时间', type: 'custom', slot: 'to' },
]

function params(): SystemAuditListParams {
  return {
    page: page.value,
    pageSize: pageSize.value,
    ...(filters.value.action.trim() ? { action: filters.value.action.trim() } : {}),
    ...(filters.value.entityType.trim() ? { entityType: filters.value.entityType.trim() } : {}),
    ...(filters.value.entityId.trim() ? { entityId: filters.value.entityId.trim() } : {}),
    ...(filters.value.requestId.trim() ? { requestId: filters.value.requestId.trim() } : {}),
    ...(filters.value.result.trim() ? { result: filters.value.result.trim() } : {}),
    ...(filters.value.from ? { from: new Date(filters.value.from).toISOString() } : {}),
    ...(filters.value.to ? { to: new Date(filters.value.to).toISOString() } : {}),
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await systemAuditApi.list(params())
    events.value = result.list
    total.value = result.total
  } catch {
    error.value = '审计日志加载失败，请重试。'
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  void load()
}

function showDetail(event: SystemAuditEvent) {
  detail.value = event
  detailOpen.value = true
}

function handleTableAction(payload: { row: SystemAuditEvent; action: { key: string } }) {
  if (payload.action.key === 'detail') showDetail(payload.row)
}

onMounted(load)
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-auto">
      <EsSearch
        v-model="filters"
        :default-visible-count="5"
        :fields="searchFields"
        @search="search"
      >
        <template #from="{ form }"
          ><ElDatePicker
            v-model="form.from"
            class="w-full"
            placeholder="选择开始时间"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
        /></template>
        <template #to="{ form }"
          ><ElDatePicker
            v-model="form.to"
            class="w-full"
            placeholder="选择结束时间"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
        /></template>
      </EsSearch>
      <div v-if="error" class="system-alert system-alert--danger" role="alert">
        <span>{{ error }}</span
        ><ElButton link type="danger" @click="load">重新加载</ElButton>
      </div>
      <div class="table-wrapper">
        <EsTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :columns="SYSTEM_AUDIT_TABLE_COLUMNS"
          :data="events"
          :loading="loading"
          :total="total"
          row-key="id"
          table-height="100%"
          @action-click="handleTableAction"
          @pagination-change="load"
        >
          <template #createdAt="{ row }">{{
            new Date(row.createdAt).toLocaleString('zh-CN')
          }}</template>
          <template #actor="{ row }">{{
            row.actor?.nickname || row.actor?.account || '系统'
          }}</template>
          <template #entity="{ row }"
            >{{ row.entityType || '—'
            }}<small class="text-muted-foreground mt-1 block">{{
              row.entityId || ''
            }}</small></template
          >
          <template #result="{ row }"
            ><ElTag
              :type="
                row.result === 'SUCCEEDED' ? 'success' : row.result === 'DENIED' ? 'danger' : 'info'
              "
              >{{ row.result }}</ElTag
            ></template
          >
          <template #requestId="{ row }">{{ row.requestId || '—' }}</template>
        </EsTable>
      </div>
    </FaPageMain>
    <ElDialog
      v-model="detailOpen"
      class="system-dialog"
      destroy-on-close
      title="审计详情"
      width="min(720px, calc(100vw - 32px))"
    >
      <dl v-if="detail" class="system-description-list">
        <div>
          <dt>事件 ID</dt>
          <dd>{{ detail.id }}</dd>
        </div>
        <div>
          <dt>操作</dt>
          <dd>{{ detail.action }}</dd>
        </div>
        <div>
          <dt>结果</dt>
          <dd>{{ detail.result }}</dd>
        </div>
        <div>
          <dt>请求编号</dt>
          <dd>{{ detail.requestId || '—' }}</dd>
        </div>
        <div>
          <dt>操作者</dt>
          <dd>{{ detail.actor?.nickname || detail.actor?.account || '系统' }}</dd>
        </div>
        <div>
          <dt>实体</dt>
          <dd>{{ detail.entityType || '—' }} / {{ detail.entityId || '—' }}</dd>
        </div>
      </dl>
      <h3 class="system-dialog-section__label">安全元数据</h3>
      <pre class="system-code-block">{{ JSON.stringify(detail?.metadata ?? {}, null, 2) }}</pre>
    </ElDialog>
  </div>
</template>
