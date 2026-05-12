<script setup lang="ts">
import type { FormInstance } from 'element-plus'

import { TEAM_NAME_OPTIONS } from '../model/defaults'
import type { TeamFormModel } from '../model/types'
import { TEAM_FORM_RULES } from '../schemas/form'

defineOptions({
  name: 'TeamForm',
})

const model = defineModel<TeamFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false)
  return Boolean(valid)
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
  <ElForm ref="formRef" :model="model" :rules="TEAM_FORM_RULES" label-width="96px">
    <ElRow :gutter="16">
      <ElCol v-if="typeof model.id === 'number'" :span="12">
        <ElFormItem label="球队ID">
          <ElInput :model-value="String(model.id)" disabled />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="球队名称" prop="name">
          <ElSelect v-model="model.name" placeholder="请选择球队名称" class="w-full">
            <ElOption
              v-for="option in TEAM_NAME_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="排序" prop="sort">
          <ElInputNumber v-model="model.sort" :min="0" :precision="0" class="w-full" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="球队头像">
          <ElInput v-model="model.avatarUrl" placeholder="请输入球队头像 URL" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="Slogan">
          <ElInput v-model="model.slogan" placeholder="请输入球队 Slogan" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="赞助商名称">
          <ElInput v-model="model.sponsorName" placeholder="请输入赞助商名称" />
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>
