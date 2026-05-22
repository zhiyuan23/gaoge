<script setup lang="ts">
import type { BatchSystemUserRolesPayload } from '@/api/system/user'

defineOptions({
  name: 'BatchRoleDialog',
})

const props = defineProps<{
  modelValue: boolean
  mode: BatchSystemUserRolesPayload['mode']
  loading?: boolean
  roleOptions: {
    label: string
    value: number
  }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: Pick<BatchSystemUserRolesPayload, 'roleIds' | 'mode'>): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const roleIds = ref<number[]>([])

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      roleIds.value = []
    }
  },
)

function handleSubmit() {
  emit('submit', {
    roleIds: roleIds.value,
    mode: props.mode,
  })
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="mode === 'append' ? '批量追加角色' : '批量替换角色'"
    width="520px"
    destroy-on-close
  >
    <ElAlert
      :title="
        mode === 'append'
          ? '会在保留现有角色的前提下追加所选角色'
          : '会用所选角色覆盖当前选中用户的角色'
      "
      type="info"
      :closable="false"
      class="mb-4"
    />
    <ElForm label-width="92px">
      <ElFormItem label="角色">
        <ElSelect v-model="roleIds" class="w-full" multiple collapse-tags placeholder="请选择角色">
          <ElOption
            v-for="item in roleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton
        type="primary"
        :loading="loading"
        :disabled="roleIds.length === 0"
        @click="handleSubmit"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
