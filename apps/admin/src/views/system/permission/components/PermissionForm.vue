<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

import type { SystemPermissionFormModel } from '../model/types'
import { SYSTEM_PERMISSION_STATUS_OPTIONS } from '../schemas/search'

defineOptions({
  name: 'SystemPermissionForm',
})

defineProps<{
  mode: 'create' | 'edit'
}>()

const model = defineModel<SystemPermissionFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const rules: FormRules<SystemPermissionFormModel> = {
  code: [
    { required: true, message: '请输入权限码', trigger: 'blur' },
    {
      pattern: /^[a-z][A-Za-z0-9-]*(\.[a-z][A-Za-z0-9-]*){2}$/,
      message: '权限码格式为 module.resource.action',
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
}

async function validate() {
  await formRef.value?.validate()
  return true
}

function reset() {
  formRef.value?.resetFields()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  reset,
  clearValidate,
})
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="rules" label-width="96px">
    <ElFormItem label="权限码" prop="code">
      <ElInput
        v-model="model.code"
        :disabled="mode === 'edit'"
        placeholder="例如 system.audit.view"
      />
    </ElFormItem>
    <ElFormItem label="权限名称" prop="name">
      <ElInput v-model="model.name" placeholder="请输入权限名称" />
    </ElFormItem>
    <ElFormItem label="权限说明" prop="description">
      <ElInput v-model="model.description" type="textarea" :rows="3" placeholder="请输入说明" />
    </ElFormItem>
    <ElFormItem label="状态" prop="status">
      <ElSelect v-model="model.status" class="w-full">
        <ElOption
          v-for="item in SYSTEM_PERMISSION_STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
  </ElForm>
</template>
