<script setup lang="ts">
defineOptions({
  name: 'SystemUserResetPasswordDialog',
})

const props = defineProps<{
  modelValue: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: { newPassword: string }): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const form = reactive({
  newPassword: '',
})

function handleSubmit() {
  emit('submit', { newPassword: form.newPassword })
}
</script>

<template>
  <ElDialog v-model="visible" title="重置密码" width="480px">
    <ElForm label-width="84px">
      <ElFormItem label="新密码">
        <ElInput v-model="form.newPassword" type="password" placeholder="请输入 6 到 18 位新密码" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">取消</ElButton>
      <ElButton type="primary" :loading="loading" @click="handleSubmit">确认重置</ElButton>
    </template>
  </ElDialog>
</template>
