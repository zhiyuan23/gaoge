<script setup lang="ts">
import type { SystemMenu } from '@/api/system/menu'

import { createEmptySystemMenuForm, createSystemMenuFormFromRow } from '../model/defaults'
import type { SystemMenuFormModel } from '../model/types'

import MenuForm from './MenuForm.vue'

defineOptions({
  name: 'SystemMenuFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  menu?: SystemMenu | null
  parentId?: number | null
  menuTree: SystemMenu[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: SystemMenuFormModel): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const formRef = ref<{
  validate: () => Promise<boolean>
  reset: () => void
  clearValidate: () => void
}>()
const formModel = ref<SystemMenuFormModel>(createEmptySystemMenuForm())

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  emit('submit', formModel.value)
}

watch(
  () => [props.modelValue, props.mode, props.menu, props.parentId] as const,
  ([opened]) => {
    if (!opened) {
      return
    }
    if (props.mode === 'edit' && props.menu) {
      formModel.value = createSystemMenuFormFromRow(props.menu)
    } else {
      const form = createEmptySystemMenuForm()
      if (props.parentId != null) {
        form.parentId = props.parentId
      }
      formModel.value = form
    }
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  },
  { immediate: true },
)
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="mode === 'create' ? (parentId != null ? '新增子菜单' : '新增根菜单') : '编辑菜单'"
    width="620px"
    destroy-on-close
  >
    <MenuForm
      ref="formRef"
      v-model:model="formModel"
      :mode="mode"
      :menu-tree="menuTree"
      :current-id="menu?.id"
    />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
