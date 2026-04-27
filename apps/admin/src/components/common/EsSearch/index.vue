<script setup lang="ts">
import type { EsSearchEmits, EsSearchProps, SearchField, SearchOption } from './types'

defineOptions({
  name: 'EsSearch',
})

const {
  fields,
  modelValue = {},
  columns = 4,
  gutter = 16,
  labelWidth = 72,
  showSearch = true,
  showReset = true,
  showCollapse = true,
  defaultVisibleCount = 3,
  autoSearch = false,
  searchDelay = 300,
  searchText = '查询',
  resetText = '重置',
} = defineProps<EsSearchProps>()

const emit = defineEmits<EsSearchEmits>()
const slots = useSlots()

const collapsed = ref(true)
const form = ref<Record<string, any>>(createInitialForm(modelValue))
let timer: ReturnType<typeof setTimeout> | undefined
let syncingFromParent = false

const activeFields = computed(() => fields.filter((field) => !field.hidden))
const needCollapse = computed(() => showCollapse && activeFields.value.length > defaultVisibleCount)
const visibleFields = computed(() => {
  if (!needCollapse.value || !collapsed.value) {
    return activeFields.value
  }
  return activeFields.value.slice(0, defaultVisibleCount)
})

// 统一生成各字段的初始值，保证 reset 和字段配置变化时行为一致。
function getFieldDefaultValue(field: SearchField) {
  if (field.defaultValue !== undefined) {
    return cloneValue(field.defaultValue)
  }
  if (field.type === 'multiSelect' || field.type === 'dateRange' || field.type === 'numberRange') {
    return []
  }
  if (field.type === 'switch') {
    return false
  }
  return ''
}

function cloneValue(value: any) {
  if (Array.isArray(value)) {
    return [...value]
  }
  if (value && typeof value === 'object') {
    return { ...value }
  }
  return value
}

// modelValue 只覆盖已传入字段，其余字段回退到配置默认值。
function createInitialForm(source: Record<string, any> = {}) {
  return fields.reduce<Record<string, any>>((result, field) => {
    result[field.key] =
      source[field.key] !== undefined ? cloneValue(source[field.key]) : getFieldDefaultValue(field)
    return result
  }, {})
}

// options 支持静态数组和函数，便于页面传入响应式选项。
function resolveOptions(field: SearchField): SearchOption[] {
  if (!field.options) {
    return []
  }
  return typeof field.options === 'function' ? field.options() : field.options
}

function getFieldSpan(field: SearchField) {
  if (field.span) {
    return field.span
  }
  return Math.max(1, Math.floor(24 / columns))
}

function emitModelValue() {
  emit('update:modelValue', { ...form.value })
}

function handleSearch() {
  emitModelValue()
  emit('search', { ...form.value })
}

// reset 会恢复默认值并触发一次查询，列表页无需额外处理清空后的刷新。
function handleReset() {
  form.value = createInitialForm()
  emitModelValue()
  emit('reset', { ...form.value })
  emit('search', { ...form.value })
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
  emit('collapseChange', collapsed.value)
}

watch(
  () => modelValue,
  (value) => {
    // 父级同步 v-model 时不触发 change/autoSearch，避免循环查询。
    syncingFromParent = true
    form.value = createInitialForm(value)
    nextTick(() => {
      syncingFromParent = false
    })
  },
  { deep: true },
)

watch(
  () => fields,
  () => {
    syncingFromParent = true
    form.value = createInitialForm(modelValue)
    nextTick(() => {
      syncingFromParent = false
    })
  },
  { deep: true },
)

watch(
  form,
  () => {
    if (syncingFromParent) {
      return
    }
    emit('change', { ...form.value })
    if (autoSearch) {
      clearTimeout(timer)
      timer = setTimeout(handleSearch, searchDelay)
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  clearTimeout(timer)
})
</script>

<template>
  <div class="es-search">
    <ElForm :model="form" :label-width="labelWidth">
      <ElRow :gutter="gutter">
        <ElCol v-for="field in visibleFields" :key="field.key" :span="getFieldSpan(field)">
          <ElFormItem :label="field.label">
            <slot
              v-if="field.slot && slots[field.slot]"
              :name="field.slot"
              :field="field"
              :form="form"
            />

            <component
              :is="field.component"
              v-else-if="field.type === 'custom' && field.component"
              v-model="form[field.key]"
              v-bind="field.componentProps"
              v-on="field.componentEvents ?? {}"
            />

            <ElInput
              v-else-if="field.type === 'input'"
              v-model="form[field.key]"
              :placeholder="field.placeholder"
              :clearable="field.clearable ?? true"
              v-bind="field.props"
            />

            <ElInputNumber
              v-else-if="field.type === 'number'"
              v-model="form[field.key]"
              class="w-full"
              v-bind="field.props"
            />

            <div v-else-if="field.type === 'numberRange'" class="es-search__range">
              <ElInputNumber
                v-model="form[field.key][0]"
                class="flex-1"
                :placeholder="field.placeholder || '最小值'"
                v-bind="field.props"
              />
              <span class="es-search__range-separator">-</span>
              <ElInputNumber
                v-model="form[field.key][1]"
                class="flex-1"
                :placeholder="field.placeholder || '最大值'"
                v-bind="field.props"
              />
            </div>

            <ElSelect
              v-else-if="field.type === 'select' || field.type === 'multiSelect'"
              v-model="form[field.key]"
              class="w-full"
              :multiple="field.type === 'multiSelect'"
              :placeholder="field.placeholder"
              :clearable="field.clearable ?? true"
              v-bind="field.props"
            >
              <ElOption
                v-for="option in resolveOptions(field)"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
                :disabled="option.disabled"
              />
            </ElSelect>

            <ElDatePicker
              v-else-if="field.type === 'date' || field.type === 'dateRange'"
              v-model="form[field.key]"
              class="w-full"
              :type="field.type === 'dateRange' ? 'daterange' : 'date'"
              :placeholder="field.type === 'date' ? field.placeholder : undefined"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              v-bind="field.props"
            />

            <ElSwitch
              v-else-if="field.type === 'switch'"
              v-model="form[field.key]"
              v-bind="field.props"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <div class="es-search__actions">
        <div class="es-search__actions-left">
          <ElButton v-if="showSearch" type="primary" @click="handleSearch">
            <template #icon>
              <FaIcon name="i-ep:search" />
            </template>
            {{ searchText }}
          </ElButton>
          <ElButton v-if="showReset" @click="handleReset">
            <template #icon>
              <FaIcon name="i-ep:refresh-left" />
            </template>
            {{ resetText }}
          </ElButton>
          <ElButton v-if="needCollapse" link type="primary" @click="toggleCollapse">
            {{ collapsed ? '展开' : '收起' }}
            <FaIcon :name="collapsed ? 'i-ep:arrow-down' : 'i-ep:arrow-up'" class="ms-1" />
          </ElButton>
        </div>
        <div class="es-search__actions-right">
          <slot name="actions" :form="form" />
        </div>
      </div>
    </ElForm>
  </div>
</template>

<style scoped>
.es-search {
  width: 100%;
}

.es-search__range {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.es-search__range-separator {
  color: var(--el-text-color-secondary);
}

.es-search__actions {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.es-search__actions-left,
.es-search__actions-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.es-search__actions-right {
  margin-left: auto;
}
</style>
