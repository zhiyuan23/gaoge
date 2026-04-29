<script setup lang="ts">
import type { Player, PlayerPayload } from '@/api/players'
import type { SearchOption } from '@/components/common/EsSearch/types'
import PlayerForm from '@/views/gaoge/player/components/PlayerForm.vue'
import { createEmptyPlayerForm } from '@/views/gaoge/player/model/defaults'
import { buildPlayerPayload, createPlayerFormFromRow } from '@/views/gaoge/player/model/mapper'
import type { PlayerFormModel } from '@/views/gaoge/player/model/types'

defineOptions({
  name: 'PlayerStandardFormDrawer',
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
  <FaDrawer
    v-model="visible"
    :title="mode === 'create' ? '新增球员' : '编辑球员'"
    :footer="false"
    content-class="pb-0"
  >
    <div class="flex flex-col gap-4">
      <PlayerForm
        ref="formRef"
        v-model:model="formModel"
        :sub-team-options="subTeamOptions"
        :position-options="positionOptions"
        :status-options="statusOptions"
      />
      <div class="flex justify-end gap-3 border-t pt-4">
        <FaButton variant="outline" @click="visible = false">取消</FaButton>
        <FaButton :loading="loading" @click="handleSubmit">保存</FaButton>
      </div>
    </div>
  </FaDrawer>
</template>
