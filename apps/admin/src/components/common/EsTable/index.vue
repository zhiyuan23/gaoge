<script setup lang="ts">
import useAuth from '@/composables/useAuth'

import { ACTION_COLUMN_MIN_WIDTH, hasVisibleActions, isActionDisabled } from './action'
import EsTableActionCell from './EsTableActionCell.vue'
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
  // 是否显示多选列
  showSelection: {
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

function normalizeColumnWidth(column: TableColumn): TableColumn {
  const { fixedWidth, width, minWidth, ...rest } = column

  if (typeof fixedWidth === 'number') {
    return {
      ...rest,
      minWidth,
      width: fixedWidth,
    }
  }

  if (typeof minWidth === 'number') {
    return {
      ...rest,
      minWidth,
      width,
    }
  }

  if (typeof width === 'number') {
    return {
      ...rest,
      minWidth: width,
    }
  }

  return rest
}

// 最终列配置（加上序号列）
const finalColumns = computed(() => {
  const prefixColumns: TableColumn[] = []

  if (props.showSelection) {
    prefixColumns.push({
      type: 'selection',
      width: 48,
      align: 'center',
      fixed: true,
      label: 'selection',
    })
  }

  const indexCol: TableColumn = {
    label: '序号',
    type: 'index',
    width: 70,
    align: 'center',
    fixed: true,
  }

  if (props.showIndex) {
    prefixColumns.push(indexCol)
  }

  const normalizedColumns = props.columns.map((col) => {
    const normalizedWidthColumn = normalizeColumnWidth(col)

    if (!col.actions?.length) {
      return normalizedWidthColumn
    }

    return {
      ...normalizedWidthColumn,
      minWidth: Math.max(normalizedWidthColumn.minWidth ?? 0, ACTION_COLUMN_MIN_WIDTH),
      fixed: normalizedWidthColumn.fixed ?? 'right',
      visible:
        (normalizedWidthColumn.visible ?? true) && hasVisibleActions(col.actions, props.data, auth),
    }
  })

  return [...prefixColumns, ...normalizedColumns]
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

function handleActionClick(row: any, action: TableAction) {
  if (isActionDisabled(action, row)) {
    return
  }

  emit('actionClick', {
    row,
    action,
  })
}

function handleSelectionChange(rows: any[]) {
  emit('selectionChange', rows)
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
      @selection-change="handleSelectionChange"
    >
      <template v-for="col in finalColumns" :key="col.prop || col.type || col.label">
        <ElTableColumn v-if="col.type === 'selection' || col.type === 'index'" v-bind="col" />

        <ElTableColumn v-else-if="col.actions?.length && (col.visible ?? true)" v-bind="col">
          <template #default="{ row }">
            <EsTableActionCell
              :actions="col.actions"
              :row="row"
              @action-click="(action) => handleActionClick(row, action)"
            />
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
</style>
