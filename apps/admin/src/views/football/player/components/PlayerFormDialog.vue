<script setup lang="ts">
import type { Player, PlayerPayload } from '@/api/players'
import type { SearchOption } from '@/components/common/EsSearch/types'

import { createEmptyPlayerForm } from '../model/defaults'
import { buildPlayerPayload, createPlayerFormFromRow } from '../model/mapper'
import type { PlayerFormModel } from '../model/types'

import PlayerForm from './PlayerForm.vue'

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

type PlayerFormExpose = {
  validate: () => Promise<boolean>
  reset: () => void
  clearValidate: () => void
}

const formRef = ref<PlayerFormExpose>()
const formModel = ref<PlayerFormModel>(createEmptyPlayerForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  emit('submit', buildPlayerPayload(formModel.value))
}

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
    formRef.value?.reset()
  }
})
</script>

<template>
  <ElDialog v-model="visible" :title="mode === 'create' ? '新增球员' : '编辑球员'" width="640px">
    <PlayerForm
      ref="formRef"
      v-model:model="formModel"
      :sub-team-options="subTeamOptions"
      :position-options="positionOptions"
      :status-options="statusOptions"
    />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
