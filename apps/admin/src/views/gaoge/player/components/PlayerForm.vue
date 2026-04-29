<script setup lang="ts">
import type { FormInstance } from 'element-plus'

import type { SearchOption } from '@/components/common/EsSearch/types'

import type { PlayerFormModel } from '../model/types'
import { getPlayerStatusLabel, PLAYER_FORM_RULES, PLAYER_STATUS_OPTIONS } from '../schemas/form'

defineOptions({
  name: 'PlayerForm',
})

const props = defineProps<{
  subTeamOptions: SearchOption[]
  positionOptions: SearchOption[]
  statusOptions: SearchOption[]
}>()

const model = defineModel<PlayerFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const customStatusOptions = computed(() =>
  props.statusOptions.filter((item) => !['active', 'inactive'].includes(String(item.value))),
)

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
  <ElForm ref="formRef" :model="model" :rules="PLAYER_FORM_RULES" label-width="96px">
    <ElRow :gutter="16">
      <ElCol :span="12">
        <ElFormItem label="OpenID" prop="openid">
          <ElInput v-model="model.openid" placeholder="请输入 OpenID（非必填）" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="球员号码" prop="playerNumber">
          <ElInputNumber v-model="model.playerNumber" :min="0" :max="100" class="w-full" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="昵称" prop="nickname">
          <ElInput v-model="model.nickname" placeholder="请输入昵称" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="真实姓名">
          <ElInput v-model="model.realName" placeholder="请输入真实姓名" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="头像地址">
          <ElInput v-model="model.avatarUrl" placeholder="请输入头像 URL" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="分队">
          <ElSelect
            v-model="model.subTeam"
            placeholder="请输入或选择分队"
            clearable
            filterable
            allow-create
            default-first-option
          >
            <ElOption
              v-for="item in subTeamOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="位置">
          <ElSelect
            v-model="model.position"
            placeholder="请输入或选择位置"
            clearable
            filterable
            allow-create
            default-first-option
          >
            <ElOption
              v-for="item in positionOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="球衣尺码">
          <ElInput v-model="model.jerseySize" placeholder="例如 L / XL" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="状态">
          <ElSelect
            v-model="model.status"
            placeholder="请输入或选择状态"
            filterable
            allow-create
            default-first-option
          >
            <ElOption
              v-for="item in PLAYER_STATUS_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
            <ElOption
              v-for="item in customStatusOptions"
              :key="String(item.value)"
              :label="getPlayerStatusLabel(String(item.value))"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="出生日期">
          <ElDatePicker
            v-model="model.birthDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择出生日期"
            class="w-full"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="管理员">
          <ElSwitch v-model="model.isAdmin" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="备注">
          <ElInput v-model="model.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>
