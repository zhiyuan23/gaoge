<script setup lang="ts">
import type { MatchRound, MatchRoundPayload, UpdateMatchRoundPayload } from '@/api/match-rounds'
import type { Team } from '@/api/teams'

import { createEmptyMatchRoundForm } from '../model/defaults'
import {
  buildMatchRoundPayload,
  buildMatchRoundUpdatePayload,
  createMatchRoundFormFromRow,
} from '../model/mapper'
import type { MatchRoundFormModel } from '../model/types'

import MatchRoundForm from './MatchRoundForm.vue'

defineOptions({
  name: 'MatchRoundFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  matchRound?: MatchRound | null
  teams: Team[]
  teamsValid: boolean
  teamsWarning: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: MatchRoundPayload | UpdateMatchRoundPayload): void
}>()

type MatchRoundFormExpose = {
  validate: () => Promise<boolean>
  reset: () => void
  clearValidate: () => void
}

const formRef = ref<MatchRoundFormExpose>()
const formModel = ref<MatchRoundFormModel>(createEmptyMatchRoundForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

async function handleSubmit() {
  if (!props.teamsValid) {
    return
  }

  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }

  emit(
    'submit',
    props.mode === 'create'
      ? buildMatchRoundPayload(formModel.value)
      : buildMatchRoundUpdatePayload(formModel.value),
  )
}

watch(
  () => [props.modelValue, props.mode, props.matchRound, props.teams] as const,
  ([modelValue]) => {
    if (!modelValue) {
      return
    }

    formModel.value =
      props.mode === 'edit' && props.matchRound
        ? createMatchRoundFormFromRow(props.matchRound, props.teams)
        : createEmptyMatchRoundForm(props.teams)

    nextTick(() => {
      formRef.value?.clearValidate()
    })
  },
  { immediate: true },
)

watch(visible, (value) => {
  if (!value) {
    formRef.value?.reset()
  }
})
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="mode === 'create' ? '新增比赛信息' : '编辑比赛信息'"
    width="720px"
  >
    <MatchRoundForm
      ref="formRef"
      v-model:model="formModel"
      :teams-valid="teamsValid"
      :teams-warning="teamsWarning"
    />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" :disabled="!teamsValid" @click="handleSubmit">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
