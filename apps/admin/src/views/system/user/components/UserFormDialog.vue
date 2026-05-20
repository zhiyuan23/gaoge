<script setup lang="ts">
import type { SystemUser } from '@/api/system/user'

import { createEmptySystemUserForm, createSystemUserFormFromRow } from '../model/defaults'
import type { SystemUserFormModel } from '../model/types'

import UserForm from './UserForm.vue'

defineOptions({
  name: 'SystemUserFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  user?: SystemUser | null
  loading?: boolean
  roleOptions: {
    label: string
    value: number
  }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: SystemUserFormModel): void
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
const formModel = ref<SystemUserFormModel>(createEmptySystemUserForm())

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  emit('submit', formModel.value)
}

watch(
  () => [props.modelValue, props.mode, props.user] as const,
  ([opened]) => {
    if (!opened) {
      return
    }
    formModel.value =
      props.mode === 'edit' && props.user
        ? createSystemUserFormFromRow(props.user)
        : createEmptySystemUserForm()
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
    :title="mode === 'create' ? '新增用户' : '编辑用户'"
    width="640px"
    destroy-on-close
  >
    <UserForm ref="formRef" v-model:model="formModel" :mode="mode" :role-options="roleOptions" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
