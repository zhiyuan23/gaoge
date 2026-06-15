<script setup lang="ts">
import type { Banner, BannerPayload } from '@/api/content/banner'

import { createEmptyBannerForm } from '../model/defaults'
import { buildBannerPayload, createBannerFormFromRow } from '../model/mapper'
import type { BannerFormModel } from '../model/types'

import BannerForm from './BannerForm.vue'

defineOptions({
  name: 'BannerFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  banner?: Banner | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: BannerPayload): void
}>()

type BannerFormExpose = {
  validate: () => Promise<boolean>
  clearValidate: () => void
}

const formRef = ref<BannerFormExpose>()
const formModel = ref<BannerFormModel>(createEmptyBannerForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }

  emit('submit', buildBannerPayload(formModel.value))
}

watch(
  () => [props.modelValue, props.mode, props.banner] as const,
  ([modelValue]) => {
    if (!modelValue) {
      return
    }

    formModel.value =
      props.mode === 'edit' && props.banner
        ? createBannerFormFromRow(props.banner)
        : createEmptyBannerForm()

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
    :title="mode === 'create' ? '新增 Banner' : '编辑 Banner'"
    width="720px"
    destroy-on-close
  >
    <BannerForm ref="formRef" v-model:model="formModel" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
