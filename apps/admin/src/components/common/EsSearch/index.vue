<script setup lang="ts">
import type { EsSearchEmits, EsSearchProps, SearchField } from './types'

const {
  showSearch = true,
  showReset = true,
  searchText = '查询',
  resetText = '重置',
  defaultShowCount = 3,
  autoSearch = false,
  searchDelay = 300,
  columns = 4,
  gap = 16,
  labelWidth = 120,
  labelPosition = 'left',
  showCollapse = true,
  fields,
} = defineProps<EsSearchProps>()

const emit = defineEmits<EsSearchEmits>()

// 内部状态
const innerCollapsed = reactive({ value: true })

// 表单
const form = reactive<Record<string, any>>({})

// 初始化默认值
function initForm() {
  fields.forEach((field) => {
    form[field.key] = field.defaultValue ?? (field.type.includes('range') ? [] : '')
  })
}
initForm()

// 可见字段
const visibleFields = computed(() => {
  if (!showCollapse || !innerCollapsed.value) {
    return fields.filter((f) => !f.hidden)
  }
  return fields.slice(0, defaultShowCount)
})

// 是否需要折叠
const needCollapse = computed(() => fields.length > defaultShowCount)

// grid 布局
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns}, 1fr)`,
  gap: `${gap}px`,
}))

const labelWidthStyle = computed(() =>
  typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth,
)

// select
function handleSelect(e: any, field: SearchField) {
  const index = e.detail.value
  form[field.key] = field.options?.[index]?.value
}

// label
function getSelectLabel(field: SearchField) {
  return field.options?.find((i) => i.value === form[field.key])?.label
}

// range
function setRange(field: SearchField, idx: number, val: string) {
  if (!form[field.key]) {
    form[field.key] = []
  }
  form[field.key][idx] = val
}

// 查询
function handleSearch() {
  emit('update:modelValue', { ...form })
  emit('search', { ...form })
}

// 重置
function handleReset() {
  initForm()
  emit('reset', { ...form })
  handleSearch()
}

// 折叠
function toggleCollapse() {
  innerCollapsed.value = !innerCollapsed.value
  emit('collapseChange', innerCollapsed.value)
}

// autoSearch
let timer: any = null
watch(
  form,
  () => {
    emit('change', { ...form })

    if (autoSearch) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        handleSearch()
      }, searchDelay)
    }
  },
  { deep: true },
)
</script>

<template>
  <view class="es-search">
    <!-- 字段区域 -->
    <view class="es-search__fields" :style="gridStyle">
      <template v-for="field in visibleFields" :key="field.key">
        <view class="es-search__item">
          <!-- label -->
          <view
            v-if="labelPosition === 'left'"
            class="es-search__label"
            :style="{ width: labelWidthStyle }"
          >
            {{ field.label }}
          </view>

          <view class="es-search__control">
            <!-- input -->
            <input
              v-if="field.type === 'input'"
              v-model="form[field.key]"
              :placeholder="field.placeholder"
              class="es-input"
            />

            <!-- number -->
            <input
              v-else-if="field.type === 'number'"
              v-model="form[field.key]"
              type="number"
              class="es-input"
            />

            <!-- select -->
            <picker
              v-else-if="field.type === 'select'"
              :range="field.options"
              range-key="label"
              @change="(e: any) => handleSelect(e, field)"
            >
              <view class="es-input">
                {{ getSelectLabel(field) || field.placeholder || '请选择' }}
              </view>
            </picker>

            <!-- switch -->
            <ElSwitch v-else-if="field.type === 'switch'" v-model="form[field.key]" />

            <!-- date -->
            <picker
              v-else-if="field.type === 'date'"
              mode="date"
              @change="(e: { detail: { value: any } }) => (form[field.key] = e.detail.value)"
            >
              <view class="es-input">
                {{ form[field.key] || field.placeholder || '请选择日期' }}
              </view>
            </picker>

            <!-- date-range -->
            <view v-else-if="field.type === 'date-range'" class="range">
              <picker
                mode="date"
                @change="(e: { detail: { value: string } }) => setRange(field, 0, e.detail.value)"
              >
                <view class="es-input small">
                  {{ form[field.key]?.[0] || '开始' }}
                </view>
              </picker>
              <text class="line"> - </text>
              <picker
                mode="date"
                @change="(e: { detail: { value: string } }) => setRange(field, 1, e.detail.value)"
              >
                <view class="es-input small">
                  {{ form[field.key]?.[1] || '结束' }}
                </view>
              </picker>
            </view>

            <!-- 自定义组件 -->
            <component
              :is="field.component"
              v-else-if="field.component"
              v-model="form[field.key]"
              v-bind="field.componentProps"
              v-on="field.componentEvents"
            />
          </view>
        </view>
      </template>
    </view>

    <!-- 操作区 -->
    <view class="es-search__actions">
      <view class="left">
        <button v-if="showSearch" class="btn primary" @click="handleSearch">
          {{ searchText }}
        </button>

        <button v-if="showReset" class="btn" @click="handleReset">
          {{ resetText }}
        </button>
      </view>

      <view v-if="showCollapse && needCollapse" class="toggle" @click="toggleCollapse">
        {{ innerCollapsed ? '展开' : '收起' }}
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.es-search {
  padding: 20px;
  background: #fff;
  border-radius: 16px;
}

.es-search__item {
  display: flex;
  align-items: center;
}

.es-search__label {
  margin-right: 12px;
  font-size: 24px;
  color: #666;
}

.es-search__control {
  flex: 1;
}

.es-input {
  height: 64px;
  padding: 0 16px;
  font-size: 26px;
  line-height: 64px;
  background: #f5f7fa;
  border-radius: 8px;
}

.range {
  display: flex;
  align-items: center;

  .small {
    flex: 1;
  }

  .line {
    margin: 0 8px;
  }
}

.es-search__actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;

  .btn {
    height: 64px;
    padding: 0 24px;
    margin-right: 12px;
    background: #eee;
    border-radius: 8px;

    &.primary {
      color: #fff;
      background: #1677ff;
    }
  }

  .toggle {
    font-size: 26px;
    color: #1677ff;
  }
}
</style>
