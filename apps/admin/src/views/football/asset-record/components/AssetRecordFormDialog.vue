<script setup lang="ts">
import type {
  AssetRecord,
  AssetRecordDirection,
  AssetRecordPayload,
} from '@/api/football/asset-record'

import { createEmptyAssetRecordForm } from '../model/defaults'
import { buildAssetRecordPayload, createAssetRecordFormFromRow } from '../model/mapper'
import type { AssetRecordFormModel } from '../model/types'

import AssetRecordForm from './AssetRecordForm.vue'

defineOptions({
  name: 'AssetRecordFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  assetRecord?: AssetRecord | null
  initialDirection?: AssetRecordDirection
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: AssetRecordPayload): void
}>()

type AssetRecordFormExpose = {
  validate: () => Promise<boolean>
  clearValidate: () => void
}

const formRef = ref<AssetRecordFormExpose>()
const formModel = ref<AssetRecordFormModel>(createEmptyAssetRecordForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }

  emit('submit', buildAssetRecordPayload(formModel.value))
}

watch(
  () => [props.modelValue, props.mode, props.assetRecord, props.initialDirection] as const,
  ([modelValue]) => {
    if (!modelValue) {
      return
    }

    formModel.value =
      props.mode === 'edit' && props.assetRecord
        ? createAssetRecordFormFromRow(props.assetRecord)
        : createEmptyAssetRecordForm(props.initialDirection ?? 'income')

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
    :title="mode === 'create' ? '新增资产记录' : '编辑资产记录'"
    width="700px"
    destroy-on-close
  >
    <AssetRecordForm ref="formRef" v-model:model="formModel" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
