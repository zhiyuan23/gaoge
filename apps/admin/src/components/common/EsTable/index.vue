<script setup lang="ts">
import useAuth from '@/composables/useAuth'

import type { EsTableEmits, TableAction, TableColumn, TableSize } from './types'

defineOptions({
  name: 'EsTable',
})

const props = defineProps({
  // 表格列配置
  columns: {
    type: Array as PropType<TableColumn[]>,
    required: true,
  },
  // 是否显示序号列
  showIndex: {
    type: Boolean,
    default: false,
  },
  // 表格数据
  data: {
    type: Array,
    default: () => [],
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true,
  },
  // 总条目数
  total: {
    type: Number,
    default: 0,
  },
  // 当前页码
  page: {
    type: Number,
    default: 1,
  },
  // 每页显示条目数
  pageSize: {
    type: Number,
    default: 20,
  },
  // 每页显示个数选择器的选项设置
  pageSizes: {
    type: Array as PropType<number[]>,
    default: () => [10, 20, 50, 100],
  },
  // 分页布局
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper',
  },
  // 是否为分页按钮添加背景色
  background: {
    type: Boolean,
    default: true,
  },
  // 是否显示边框
  border: {
    type: Boolean,
    default: true,
  },
  // 表格尺寸
  tableSize: {
    type: String as () => TableSize,
    default: '' as TableSize,
    validator: (value: string): value is TableSize => {
      return ['', 'default', 'small', 'large'].includes(value)
    },
  },
  // 表格高度
  tableHeight: {
    type: [String, Number],
    default: '100%',
  },
  // 表格最大高度
  maxHeight: {
    type: [String, Number],
    default: '100%',
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<EsTableEmits>()
const { auth } = useAuth()

// 当前页码
const currentPage = ref(props.page)
// 每页条数
const internalPageSize = ref(props.pageSize)

// 最终列配置（加上序号列）
const finalColumns = computed(() => {
  const indexCol: TableColumn = {
    label: '序号',
    type: 'index',
    width: 70,
    align: 'center',
    fixed: true,
  }

  return props.showIndex ? [indexCol, ...props.columns] : props.columns
})

// 监听外部传入的页码变化
watch(
  () => props.page,
  (val) => {
    currentPage.value = val
  },
)

// 监听外部传入的每页条数变化
watch(
  () => props.pageSize,
  (val) => {
    internalPageSize.value = val
  },
)

// 每页条数改变
function handleSizeChange(size: number) {
  internalPageSize.value = size
  emit('update:pageSize', size)
  emitPaginationChange()
}

// 当前页改变
function handleCurrentChange(page: number) {
  currentPage.value = page
  emit('update:page', page)
  emitPaginationChange()
}

// 触发分页改变事件
function emitPaginationChange() {
  emit('paginationChange', {
    page: currentPage.value,
    pageSize: internalPageSize.value,
  })
}

function isActionVisible(action: TableAction, row: any) {
  const visible = typeof action.visible === 'function' ? action.visible(row) : action.visible
  if (visible === false) {
    return false
  }

  return action.auth ? auth(action.auth) : true
}

function isActionDisabled(action: TableAction, row: any) {
  return typeof action.disabled === 'function' ? action.disabled(row) : Boolean(action.disabled)
}

function getColumnActions(col: TableColumn, row: any) {
  return (col.actions ?? []).filter((action) => isActionVisible(action, row))
}

function getActionTextClass(type?: TableAction['type']) {
  if (type === 'danger') {
    return 'text-danger'
  }

  if (type === 'primary') {
    return 'text-primary'
  }

  return ''
}

function handleActionClick(row: any, action: TableAction) {
  if (isActionDisabled(action, row)) {
    return
  }

  emit('actionClick', {
    row,
    action,
  })
}
</script>

<template>
  <div class="flex-col" :class="showPagination ? 'h-[calc(100%-45px)]' : 'h-full'">
    <!-- 表格区域 -->
    <ElTable
      v-loading="loading"
      :data="data"
      :border="border"
      :height="tableHeight"
      :max-height="maxHeight"
      :size="tableSize"
      stripe
      class="w-full"
      :class="tableSize ? '' : 'table-wrap'"
      v-bind="$attrs"
      color="text-primary"
    >
      <template v-for="col in finalColumns" :key="col.prop">
        <ElTableColumn v-if="col.actions?.length" v-bind="col">
          <template #default="{ row, $index }">
            <div class="flex-center">
              <template v-if="getColumnActions(col, row).length === 1">
                <ElButton
                  :type="getColumnActions(col, row)[0]?.type ?? 'primary'"
                  :disabled="isActionDisabled(getColumnActions(col, row)[0], row)"
                  link
                  @click="handleActionClick(row, getColumnActions(col, row)[0])"
                >
                  {{ getColumnActions(col, row)[0]?.label }}
                </ElButton>
              </template>
              <template v-else-if="getColumnActions(col, row).length > 1">
                <ElDropdown
                  trigger="hover"
                  @command="(action: TableAction) => handleActionClick(row, action)"
                >
                  <ElButton link class="table-action-trigger" aria-label="更多操作">
                    <FaIcon name="i-ri:more-fill" class="size-4" />
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem
                        v-for="action in getColumnActions(col, row)"
                        :key="`${action.key}-${$index}`"
                        :command="action"
                        :disabled="isActionDisabled(action, row)"
                      >
                        <span :class="getActionTextClass(action.type)">
                          {{ action.label }}
                        </span>
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </template>
              <span v-else class="text-secondary">--</span>
            </div>
          </template>
        </ElTableColumn>

        <!-- 自定义列插槽 -->
        <ElTableColumn v-else-if="col.slot" v-bind="col">
          <template #default="scope">
            <slot :name="col.slot" v-bind="{ ...scope, actionParams: col.actionParams }" />
          </template>
        </ElTableColumn>

        <!-- 普通列 -->
        <ElTableColumn
          v-else-if="col.visible ?? true"
          v-bind="col"
          show-overflow-tooltip
          color="text-primary"
        >
          <template #default="{ row }">
            <ElLink
              v-if="col.link && row[col.linkParams.name]"
              type="primary"
              @click="() => emit('linkClick', { row, prop: col.prop, linkParams: col.linkParams })"
            >
              {{ row[col.prop!] }}
            </ElLink>
          </template>
        </ElTableColumn>
      </template>
    </ElTable>

    <!-- 分页区域 -->
    <div v-if="showPagination" class="flex-center-end mt-4">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="internalPageSize"
        :layout="paginationLayout"
        :page-sizes="pageSizes"
        :total="total"
        :background="background"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.el-table__header th) {
  color: text-primary;
}

/* 保持表格行高统一 */
:deep(.el-table .el-table__cell) {
  height: 40px;
  padding: 0;
}

:deep(.el-table-fixed-column--right) {
  padding: 0;
}

:deep(.table-action-trigger) {
  color: rgb(var(--ui-muted-foreground));
}

:deep(.table-action-trigger:hover),
:deep(.table-action-trigger:focus-visible) {
  color: rgb(var(--ui-foreground));
}
</style>
