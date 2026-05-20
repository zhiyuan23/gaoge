<script setup lang="ts">
import type { SystemRole } from '@/api/system/role'

import { createEmptySystemRoleForm, createSystemRoleFormFromRow } from '../model/defaults'
import type { SystemRoleFormModel } from '../model/types'

import RoleForm from './RoleForm.vue'

defineOptions({
  name: 'SystemRoleFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  role?: SystemRole | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: SystemRoleFormModel): void
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
const formModel = ref<SystemRoleFormModel>(createEmptySystemRoleForm())

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  emit('submit', formModel.value)
}

watch(
  () => [props.modelValue, props.mode, props.role] as const,
  ([opened]) => {
    if (!opened) {
      return
    }
    formModel.value =
      props.mode === 'edit' && props.role
        ? createSystemRoleFormFromRow(props.role)
        : createEmptySystemRoleForm()
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
    :title="mode === 'create' ? '新增角色' : '编辑角色'"
    width="560px"
    destroy-on-close
  >
    <RoleForm ref="formRef" v-model:model="formModel" :mode="mode" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
