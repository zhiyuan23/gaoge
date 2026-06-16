<script setup lang="ts">
import type { RumorPost } from '@/api/content/rumor-post'
import type { SearchOption } from '@/components/common/EsSearch/types'

import { createEmptyRumorPostForm } from '../model/defaults'
import { buildRumorPostPayload, createRumorPostFormFromRow } from '../model/mapper'
import type { RumorPostFormModel } from '../model/types'

import RumorPostForm from './RumorPostForm.vue'

defineOptions({
  name: 'RumorPostFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  post?: RumorPost | null
  tagOptions: SearchOption[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'submit',
    payload: {
      data: ReturnType<typeof buildRumorPostPayload>
      action: 'draft' | 'publish' | 'save'
    },
  ): void
}>()

type RumorPostFormExpose = {
  validate: () => Promise<boolean>
  clearValidate: () => void
}

const formRef = ref<RumorPostFormExpose>()
const formModel = ref<RumorPostFormModel>(createEmptyRumorPostForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isPublishedEditing = computed(
  () => props.mode === 'edit' && props.post?.status === 'published',
)

async function handleSubmit(action: 'draft' | 'publish' | 'save') {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }

  emit('submit', {
    data: buildRumorPostPayload(formModel.value),
    action,
  })
}

watch(
  () => [props.modelValue, props.mode, props.post] as const,
  ([modelValue]) => {
    if (!modelValue) {
      return
    }

    formModel.value =
      props.mode === 'edit' && props.post
        ? createRumorPostFormFromRow(props.post)
        : createEmptyRumorPostForm()

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
    :title="mode === 'create' ? '新增流言动态' : '编辑流言动态'"
    width="720px"
    destroy-on-close
  >
    <RumorPostForm ref="formRef" v-model:model="formModel" :mode="mode" :tag-options="tagOptions" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton v-if="!isPublishedEditing" :loading="loading" @click="handleSubmit('draft')">
        保存草稿
      </ElButton>
      <ElButton
        v-if="!isPublishedEditing"
        type="primary"
        :loading="loading"
        @click="handleSubmit('publish')"
      >
        发布
      </ElButton>
      <ElButton
        v-if="isPublishedEditing"
        type="primary"
        :loading="loading"
        @click="handleSubmit('save')"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
