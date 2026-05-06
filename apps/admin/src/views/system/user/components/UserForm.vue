<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

import type { SystemUserFormModel } from '../model/types'
import { SYSTEM_USER_ROLE_OPTIONS, SYSTEM_USER_STATUS_OPTIONS } from '../schemas/search'

defineOptions({
  name: 'SystemUserForm',
})

const props = defineProps<{
  mode: 'create' | 'edit'
}>()

const model = defineModel<SystemUserFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const rules: FormRules<SystemUserFormModel> = {
  account: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  password: [
    {
      required: props.mode === 'create',
      message: '请输入初始密码',
      trigger: 'blur',
    },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
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
    <ElFormItem label="登录账号" prop="account">
      <ElInput v-model="model.account" :disabled="mode === 'edit'" placeholder="请输入登录账号" />
    </ElFormItem>
    <ElFormItem :label="mode === 'create' ? '初始密码' : '密码'" prop="password">
      <ElInput
        v-model="model.password"
        type="password"
        :placeholder="mode === 'create' ? '请输入初始密码' : '编辑时留空，密码走单独重置'"
        :disabled="mode === 'edit'"
      />
    </ElFormItem>
    <ElFormItem label="昵称" prop="nickname">
      <ElInput v-model="model.nickname" placeholder="请输入昵称" />
    </ElFormItem>
    <ElFormItem label="头像地址" prop="avatarUrl">
      <ElInput v-model="model.avatarUrl" placeholder="请输入头像 URL" />
    </ElFormItem>
    <ElFormItem label="角色" prop="role">
      <ElSelect v-model="model.role" class="w-full">
        <ElOption
          v-for="item in SYSTEM_USER_ROLE_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="状态" prop="status">
      <ElSelect v-model="model.status" class="w-full">
        <ElOption
          v-for="item in SYSTEM_USER_STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </ElFormItem>
  </ElForm>
</template>
