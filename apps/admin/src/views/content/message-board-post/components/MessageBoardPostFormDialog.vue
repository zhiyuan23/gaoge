<script setup lang="ts">
import type { MessageBoardPost } from '@/api/content/message-board-post'
import type { SearchOption } from '@/components/common/EsSearch/types'

import { createEmptyMessageBoardPostForm } from '../model/defaults'
import { buildMessageBoardPostPayload, createMessageBoardPostFormFromRow } from '../model/mapper'
import type { MessageBoardPostFormModel } from '../model/types'

import MessageBoardPostForm from './MessageBoardPostForm.vue'

defineOptions({
  name: 'MessageBoardPostFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  post?: MessageBoardPost | null
  tagOptions: SearchOption[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'submit',
    payload: {
      data: ReturnType<typeof buildMessageBoardPostPayload>
      action: 'draft' | 'publish' | 'save'
    },
  ): void
}>()

type MessageBoardPostFormExpose = {
  validate: () => Promise<boolean>
  clearValidate: () => void
}

const formRef = ref<MessageBoardPostFormExpose>()
const formModel = ref<MessageBoardPostFormModel>(createEmptyMessageBoardPostForm())

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
    data: buildMessageBoardPostPayload(formModel.value),
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
        ? createMessageBoardPostFormFromRow(props.post)
        : createEmptyMessageBoardPostForm()

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
    :title="mode === 'create' ? '新增留言板消息' : '编辑留言板消息'"
    width="720px"
    destroy-on-close
  >
    <MessageBoardPostForm
      ref="formRef"
      v-model:model="formModel"
      :mode="mode"
      :tag-options="tagOptions"
    />
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
