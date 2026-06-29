<script setup lang="ts">
import type { FormInstance } from 'element-plus'

import type { FootballPosition } from '@gaoge/shared-types'

import type { SearchOption } from '@/components/common/EsSearch/types'

import type { PlayerFormModel } from '../model/types'
import { getPlayerStatusLabel, PLAYER_FORM_RULES, PLAYER_STATUS_OPTIONS } from '../schemas/form'

defineOptions({
  name: 'PlayerForm',
})

const props = defineProps<{
  teamOptions: SearchOption[]
  positionOptions: SearchOption[]
  statusOptions: SearchOption[]
}>()

const model = defineModel<PlayerFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const customStatusOptions = computed(() =>
  props.statusOptions.filter((item) => !['active', 'inactive'].includes(String(item.value))),
)
const primaryTeamOptions = computed(() =>
  props.teamOptions.filter((item) => model.value.teamIds.includes(Number(item.value))),
)
const primaryPositionOptions = computed(() =>
  props.positionOptions.filter((item) =>
    model.value.positions.includes(String(item.value) as FootballPosition),
  ),
)

watch(
  () => model.value.teamIds.slice(),
  (teamIds) => {
    if (model.value.primaryTeamId !== '' && !teamIds.includes(model.value.primaryTeamId)) {
      model.value.primaryTeamId = ''
    }
  },
)

watch(
  () => model.value.positions.slice(),
  (positions) => {
    if (model.value.primaryPosition && !positions.includes(model.value.primaryPosition)) {
      model.value.primaryPosition = ''
    }
  },
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
  <ElForm
    ref="formRef"
    :model="model"
    :rules="PLAYER_FORM_RULES"
    label-width="96px"
    class="gaoge-form"
  >
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
        <ElFormItem label="代表球队" prop="teamIds">
          <ElSelect
            v-model="model.teamIds"
            placeholder="请选择代表球队"
            multiple
            collapse-tags
            collapse-tags-tooltip
            filterable
          >
            <ElOption
              v-for="item in teamOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="主队">
          <ElSelect v-model="model.primaryTeamId" placeholder="请选择主队" filterable>
            <ElOption label="无主队" value="" />
            <ElOption
              v-for="item in primaryTeamOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="球衣名称">
          <ElInput v-model="model.jerseyName" placeholder="请输入球衣名称" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="可踢位置" prop="positions">
          <ElSelect
            v-model="model.positions"
            placeholder="请选择可踢位置"
            multiple
            collapse-tags
            collapse-tags-tooltip
            filterable
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
        <ElFormItem label="主位置">
          <ElSelect v-model="model.primaryPosition" placeholder="请选择主位置" filterable>
            <ElOption label="无主位置" value="" />
            <ElOption
              v-for="item in primaryPositionOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
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
        <ElFormItem label="球衣尺码">
          <ElInput v-model="model.jerseySize" placeholder="例如 L / XL" />
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
      <ElCol :span="12">
        <ElFormItem label="签名/简介" prop="signature">
          <ElInput
            v-model="model.signature"
            placeholder="请输入 15 字以内签名"
            maxlength="15"
            show-word-limit
          />
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
