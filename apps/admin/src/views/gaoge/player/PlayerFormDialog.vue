<script setup lang="ts">
import dayjs from 'dayjs'
import type { FormInstance, FormRules } from 'element-plus'

import type { Player, PlayerPayload } from '@/api/players'
import type { SearchOption } from '@/components/common/EsSearch/types'

import {
  createEmptyPlayerForm,
  createPlayerFormFromRow,
  PLAYER_STATUS_OPTIONS,
  type PlayerFormModel,
} from './constants'
import { getPlayerStatusLabel } from './formatters'

defineOptions({
  name: 'PlayerFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  player?: Player | null
  subTeamOptions: SearchOption[]
  positionOptions: SearchOption[]
  statusOptions: SearchOption[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: PlayerPayload): void
}>()

const formRef = ref<FormInstance>()
const formModel = ref<PlayerFormModel>(createEmptyPlayerForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const formRules: FormRules<PlayerFormModel> = {
  openid: [{ required: true, message: '请输入 OpenID', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

const customStatusOptions = computed(() =>
  props.statusOptions.filter((item) => !['active', 'inactive'].includes(String(item.value))),
)

// 空字符串转 undefined，避免把可选字段保存成无意义的空值。
function normalizeText(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

// 弹窗只负责生成提交 payload，创建或更新由父页面决定。
function buildPayload(model: PlayerFormModel): PlayerPayload {
  return {
    openid: model.openid.trim(),
    nickname: model.nickname.trim(),
    realName: normalizeText(model.realName),
    avatarUrl: normalizeText(model.avatarUrl),
    subTeam: normalizeText(model.subTeam),
    birthDate: model.birthDate ? dayjs(model.birthDate).startOf('day').toISOString() : undefined,
    isAdmin: model.isAdmin,
    position: normalizeText(model.position),
    jerseySize: normalizeText(model.jerseySize),
    status: normalizeText(model.status) ?? 'active',
    remark: normalizeText(model.remark),
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  emit('submit', buildPayload(formModel.value))
}

// 每次打开弹窗时根据模式重建表单，避免上一次编辑数据残留。
watch(
  () => [props.modelValue, props.mode, props.player] as const,
  ([modelValue]) => {
    if (!modelValue) {
      return
    }
    formModel.value =
      props.mode === 'edit' && props.player
        ? createPlayerFormFromRow(props.player)
        : createEmptyPlayerForm()
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  },
  { immediate: true },
)

watch(visible, (value) => {
  if (!value) {
    formRef.value?.resetFields()
  }
})
</script>

<template>
  <ElDialog v-model="visible" :title="mode === 'create' ? '新增球员' : '编辑球员'" width="640px">
    <ElForm ref="formRef" :model="formModel" :rules="formRules" label-width="96px">
      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem label="OpenID" prop="openid">
            <ElInput v-model="formModel.openid" placeholder="请输入 OpenID" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="昵称" prop="nickname">
            <ElInput v-model="formModel.nickname" placeholder="请输入昵称" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="真实姓名">
            <ElInput v-model="formModel.realName" placeholder="请输入真实姓名" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="头像地址">
            <ElInput v-model="formModel.avatarUrl" placeholder="请输入头像 URL" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="分队">
            <ElSelect
              v-model="formModel.subTeam"
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
              v-model="formModel.position"
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
            <ElInput v-model="formModel.jerseySize" placeholder="例如 L / XL" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="状态">
            <ElSelect
              v-model="formModel.status"
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
              v-model="formModel.birthDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择出生日期"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="管理员">
            <ElSwitch v-model="formModel.isAdmin" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="24">
          <ElFormItem label="备注">
            <ElInput
              v-model="formModel.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
