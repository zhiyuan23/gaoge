import type { Component } from 'vue'

export type SearchFieldType =
  | 'input'
  | 'select'
  | 'multiSelect'
  | 'number'
  | 'numberRange'
  | 'date'
  | 'dateRange'
  | 'switch'
  | 'custom'

export type SearchOptionValue = string | number | boolean

export interface SearchOption {
  label: string
  value: SearchOptionValue
  disabled?: boolean
  children?: SearchOption[]
}

export type SearchOptions = SearchOption[] | (() => SearchOption[])

export interface SearchField {
  key: string
  label: string
  type: SearchFieldType
  placeholder?: string
  defaultValue?: any
  span?: number
  hidden?: boolean
  clearable?: boolean
  options?: SearchOptions
  props?: Record<string, any>
  component?: Component
  componentProps?: Record<string, any>
  componentEvents?: Record<string, any>
  slot?: string
}

export type SearchFormData = Record<string, any>

export interface EsSearchProps {
  fields: SearchField[]
  modelValue?: SearchFormData
  columns?: number
  gutter?: number
  labelWidth?: number | string
  showSearch?: boolean
  showReset?: boolean
  showCollapse?: boolean
  defaultVisibleCount?: number
  autoSearch?: boolean
  searchDelay?: number
  searchText?: string
  resetText?: string
}

export interface EsSearchEmits {
  (e: 'update:modelValue', formData: SearchFormData): void
  (e: 'search', formData: SearchFormData): void
  (e: 'reset', formData: SearchFormData): void
  (e: 'change', formData: SearchFormData): void
  (e: 'collapseChange', collapsed: boolean): void
}
