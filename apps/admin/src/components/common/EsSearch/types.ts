import type { Component } from 'vue'

/**
 * 筛选字段类型
 */
export type SearchFieldType =
  | 'input' // 文本输入框
  | 'number' // 数字输入框
  | 'select' // 下拉选择
  | 'multi-select' // 多选
  | 'date' // 日期选择
  | 'date-range' // 日期范围
  | 'datetime' // 日期时间
  | 'datetime-range' // 日期时间范围
  | 'cascader' // 级联选择
  | 'tree-select' // 树形选择
  | 'switch' // 开关
  | 'radio' // 单选框组
  | 'checkbox' // 多选框组

/**
 * 选项配置
 */
export interface SearchOption {
  label: string
  value: string | number
  disabled?: boolean
  children?: SearchOption[]
}

/**
 * 筛选字段配置
 */
export interface SearchField {
  /** 字段名（用于 v-model） */
  key: string
  /** 字段标签 */
  label: string
  /** 字段类型 */
  type: SearchFieldType
  /** 占位符 */
  placeholder?: string
  /** 默认值 */
  defaultValue?: any
  /** 选项列表（select/multi-select/radio/checkbox 用） */
  options?: SearchOption[]
  /** 是否必填 */
  required?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 最大长度 */
  maxlength?: number
  /** 最小值（number 类型） */
  min?: number
  /** 最大值（number 类型） */
  max?: number
  /** 精度（number 类型） */
  precision?: number
  /** 是否显示清除按钮 */
  clearable?: boolean
  /** 是否支持搜索（select 用） */
  filterable?: boolean
  /** 是否多选（select 用） */
  multiple?: boolean
  /** 日期格式 */
  format?: string
  /** 日期值格式 */
  valueFormat?: string
  /** 级联数据（cascader/tree-select 用） */
  cascaderOptions?: SearchOption[]
  /** 自定义组件（高级用法） */
  component?: Component
  /** 自定义组件事件 */
  componentEvents?: Record<string, any>
  /** 自定义组件属性 */
  componentProps?: Record<string, any>
  /** 字段宽度（支持 'auto' | 'full' | 数字 | 字符串如 '200px'） */
  width?: 'auto' | 'full' | number | string
  /** 是否隐藏 */
  hidden?: boolean
}

/**
 * 筛选表单数据
 */
export type SearchFormData = Record<string, any>

/**
 * 筛选组件 Props
 */
export interface EsSearchProps {
  /** 筛选字段配置 */
  fields: SearchField[]
  /** 表单数据（v-model） */
  modelValue?: SearchFormData
  /** 是否显示查询按钮 */
  showSearch?: boolean
  /** 是否显示重置按钮 */
  showReset?: boolean
  /** 查询按钮文字 */
  searchText?: string
  /** 重置按钮文字 */
  resetText?: string
  /** 默认显示字段数（超过则折叠） */
  defaultShowCount?: number
  /** 是否自动查询（字段变化时自动触发 search 事件） */
  autoSearch?: boolean
  /** 字段变化延迟（ms，autoSearch 为 true 时有效） */
  searchDelay?: number
  /** 每行显示字段数（0 为自适应） */
  columns?: number
  /** 字段间距 */
  gap?: number
  /** 标签宽度 */
  labelWidth?: number | string
  /** 标签对齐方式 */
  labelPosition?: 'left' | 'top'
  /** 尺寸 */
  size?: 'large' | 'default' | 'small'
  /** 是否显示折叠展开按钮 */
  showCollapse?: boolean
  /** 折叠状态（受控） */
  collapsed?: boolean
}

/**
 * 筛选组件 Emits
 */
export interface EsSearchEmits {
  /** 查询事件 */
  (e: 'search', formData: SearchFormData): void
  /** 重置事件 */
  (e: 'reset', formData: SearchFormData): void
  /** 字段变化事件 */
  (e: 'change', formData: SearchFormData): void
  /** 折叠状态变化事件 */
  (e: 'collapseChange', collapsed: boolean): void
  /** 表单数据更新事件（v-model） */
  (e: 'update:modelValue', formData: SearchFormData): void
}
