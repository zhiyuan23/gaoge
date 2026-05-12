<script setup lang="ts">
import type { Team, TeamPayload } from '@/api/basketball/team'

import { createEmptyTeamForm } from '../model/defaults'
import { buildTeamPayload, createTeamFormFromRow } from '../model/mapper'
import type { TeamFormModel } from '../model/types'

import TeamForm from './TeamForm.vue'

defineOptions({
  name: 'TeamFormDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  team?: Team | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: TeamPayload): void
}>()

type TeamFormExpose = {
  validate: () => Promise<boolean>
  clearValidate: () => void
}

const formRef = ref<TeamFormExpose>()
const formModel = ref<TeamFormModel>(createEmptyTeamForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  emit('submit', buildTeamPayload(formModel.value))
}

watch(
  () => [props.modelValue, props.mode, props.team] as const,
  ([modelValue]) => {
    if (!modelValue) {
      return
    }
    formModel.value =
      props.mode === 'edit' && props.team
        ? createTeamFormFromRow(props.team)
        : createEmptyTeamForm()
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
    :title="mode === 'create' ? '新增球队' : '编辑球队'"
    width="640px"
    destroy-on-close
  >
    <TeamForm ref="formRef" v-model:model="formModel" />
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">保存</ElButton>
    </template>
  </ElDialog>
</template>
