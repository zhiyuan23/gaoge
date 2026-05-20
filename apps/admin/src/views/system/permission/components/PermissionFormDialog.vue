<script setup lang="ts">
import type { SystemPermission } from '@/api/system/permission'

import {
  createEmptySystemPermissionForm,
  createSystemPermissionFormFromRow,
} from '../model/defaults'
import type { SystemPermissionFormModel } from '../model/types'

import PermissionForm from './PermissionForm.vue'

defineOptions({
  name: 'SystemPermissionFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  permission?: SystemPermission | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: SystemPermissionFormModel): void
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
const formModel = ref<SystemPermissionFormModel>(createEmptySystemPermissionForm())

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  emit('submit', formModel.value)
}

watch(
  () => [props.modelValue, props.permission] as const,
  ([opened]) => {
    if (!opened) {
      return
    }
    formModel.value = props.permission
      ? createSystemPermissionFormFromRow(props.permission)
      : createEmptySystemPermissionForm()
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
    :title="mode === 'create' ? '新增权限' : '编辑权限'"
    width="560px"
    destroy-on-close
  >
    <PermissionForm ref="formRef" v-model:model="formModel" :mode="mode" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
