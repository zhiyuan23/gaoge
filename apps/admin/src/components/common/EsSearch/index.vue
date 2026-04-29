<script setup lang="ts">
import FaLabel from '@/ui/components/FaLabel/index.vue'

import type { EsSearchEmits, EsSearchProps, SearchField, SearchOption } from './types'

defineOptions({
  name: 'EsSearch',
})

const {
  fields,
  modelValue = {},
  minItemWidth = 280,
  showSearch = true,
  showReset = true,
  showCollapse = true,
  defaultVisibleCount = 2,
  searchText = '筛选',
  resetText = '重置',
} = defineProps<EsSearchProps>()

const emit = defineEmits<EsSearchEmits>()
const slots = useSlots()

const collapsed = ref(true)
const form = ref<Record<string, any>>(createInitialForm(modelValue))
let syncingFromParent = false

const activeFields = computed(() => fields.filter((field) => !field.hidden))
const needCollapse = computed(() => showCollapse && activeFields.value.length > defaultVisibleCount)
const visibleFields = computed(() => {
  if (!needCollapse.value || !collapsed.value) {
    return activeFields.value
  }
  return activeFields.value.slice(0, defaultVisibleCount)
})
const gridStyle = computed(() => ({
  '--es-search-item-min-width':
    typeof minItemWidth === 'number' ? `${minItemWidth}px` : minItemWidth,
}))

function cloneValue(value: any) {
  if (Array.isArray(value)) {
    return [...value]
  }
  if (value && typeof value === 'object') {
    return { ...value }
  }
  return value
}

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

function createInitialForm(source: Record<string, any> = {}) {
  return fields.reduce<Record<string, any>>((result, field) => {
    result[field.key] =
      source[field.key] !== undefined ? cloneValue(source[field.key]) : getFieldDefaultValue(field)
    return result
  }, {})
}

function resolveOptions(field: SearchField): SearchOption[] {
  if (!field.options) {
    return []
  }
  return typeof field.options === 'function' ? field.options() : field.options
}

function emitModelValue() {
  emit('update:modelValue', { ...form.value })
}

function handleSearch() {
  emitModelValue()
  emit('search', { ...form.value })
}

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
    emitModelValue()
    emit('change', { ...form.value })
  },
  { deep: true },
)
</script>

<template>
  <div>
    <FaSearchBar :show-toggle="false">
      <template #default>
        <div class="es-search__grid" :style="gridStyle">
          <FaLabel
            v-for="field in visibleFields"
            :key="field.key"
            :label="field.label"
            class="es-search__field"
          >
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
              class="min-w-0 flex-1"
              v-bind="field.props"
              @keydown.enter="handleSearch"
              @clear="handleSearch"
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
              class="min-w-0 flex-1"
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
          </FaLabel>

          <div class="flex flex-wrap items-center justify-end gap-2 md:col-end-[-1]">
            <FaButton v-if="showReset" variant="outline" @click="handleReset">
              {{ resetText }}
            </FaButton>
            <FaButton v-if="showSearch" @click="handleSearch">
              <FaIcon name="i-ri:search-line" />
              {{ searchText }}
            </FaButton>
            <slot name="actions" :form="form" />
            <FaButton v-if="needCollapse" variant="ghost" @click="toggleCollapse">
              {{ collapsed ? '展开' : '收起' }}
              <FaIcon :name="collapsed ? 'i-ep:caret-bottom' : 'i-ep:caret-top'" />
            </FaButton>
          </div>
        </div>
      </template>
    </FaSearchBar>

    <div class="border-t-dashed mx--4 my-4 border-t" />
  </div>
</template>

<style scoped>
.es-search__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--es-search-item-min-width), 1fr));
  gap: 12px 32px;
}

.es-search__field {
  width: 100%;
}

.es-search__field :deep(.el-input__wrapper),
.es-search__field :deep(.el-select__wrapper) {
  min-height: 36px;
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
</style>
