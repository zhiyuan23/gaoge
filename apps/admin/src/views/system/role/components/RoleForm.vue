<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

import type { SystemRoleFormModel } from '../model/types'
import { SYSTEM_ROLE_STATUS_OPTIONS } from '../schemas/search'

defineOptions({
  name: 'SystemRoleForm',
})

const props = defineProps<{
  mode: 'create' | 'edit'
}>()

const model = defineModel<SystemRoleFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const rules: FormRules<SystemRoleFormModel> = {
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 64, message: '编码长度 2-64 个字符', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
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
    <ElFormItem label="角色编码" prop="code">
      <ElInput
        v-model="model.code"
        :disabled="props.mode === 'edit'"
        placeholder="如 super_admin"
      />
    </ElFormItem>
    <ElFormItem label="角色名称" prop="name">
      <ElInput v-model="model.name" placeholder="请输入角色名称" />
    </ElFormItem>
    <ElFormItem label="角色说明" prop="description">
      <ElInput v-model="model.description" type="textarea" :rows="3" placeholder="请输入说明" />
    </ElFormItem>
    <ElFormItem label="状态" prop="status">
      <ElSelect v-model="model.status" class="w-full">
        <ElOption
          v-for="item in SYSTEM_ROLE_STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="排序" prop="sort">
      <ElInputNumber v-model="model.sort" :min="0" class="w-full" />
    </ElFormItem>
  </ElForm>
</template>
