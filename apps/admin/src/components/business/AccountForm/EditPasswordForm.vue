<script setup lang="ts">
import type { FormInstance, FormItemRule, FormRules } from 'element-plus'
import { toast } from 'vue-sonner'

import useUserStore from '@/store/user'

defineOptions({
  name: 'EditPasswordForm',
})

interface PasswordFormModel {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const emits = defineEmits<{
  close: []
  dirtyChange: [dirty: boolean]
  passwordChanged: []
}>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const model = reactive<PasswordFormModel>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validateConfirmPassword: FormItemRule['validator'] = (_rule, value: string, callback) => {
  if (value !== model.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
    return
  }
  callback()
}

const rules: FormRules<PasswordFormModel> = {
  currentPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 64, message: '新密码长度为 8 到 64 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const dirty = computed(() => Object.values(model).some(Boolean))

watch(dirty, (value) => emits('dirtyChange', value), { immediate: true })

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await userStore.changePassword({
      currentPassword: model.currentPassword,
      newPassword: model.newPassword,
    })
    reset()
    toast.success('密码修改成功，请重新登录')
    emits('passwordChanged')
  } finally {
    loading.value = false
  }
}

function reset() {
  model.currentPassword = ''
  model.newPassword = ''
  model.confirmPassword = ''
  formRef.value?.clearValidate()
}

defineExpose({
  reset,
})
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
    <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div class="bg-primary/5 mb-6 flex gap-3 rounded-xl border p-4">
        <FaIcon name="i-lucide:shield-check" class="text-primary mt-0.5 size-5 shrink-0" />
        <div>
          <div class="text-foreground text-sm font-medium">修改后需要重新登录</div>
          <p class="text-muted-foreground mt-1 text-xs leading-5">
            为保护账号安全，更新密码后旧的刷新登录状态会失效。
          </p>
        </div>
      </div>

      <ElForm
        ref="formRef"
        :model="model"
        :rules="rules"
        label-position="top"
        class="gaoge-form max-w-xl"
        scroll-to-error
      >
        <ElFormItem label="原密码" prop="currentPassword">
          <ElInput
            v-model="model.currentPassword"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="请输入原密码"
          />
        </ElFormItem>
        <ElFormItem label="新密码" prop="newPassword">
          <ElInput
            v-model="model.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="请输入 8 到 64 位新密码"
          />
        </ElFormItem>
        <ElFormItem label="确认新密码" prop="confirmPassword">
          <ElInput
            v-model="model.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="请再次输入新密码"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <footer class="bg-muted/20 flex justify-end gap-3 border-t px-4 py-4 sm:px-8">
      <FaButton type="button" variant="outline" class="min-h-11" @click="emits('close')">
        取消
      </FaButton>
      <FaButton type="submit" class="min-h-11" :disabled="!dirty" :loading="loading">
        更新密码
      </FaButton>
    </footer>
  </form>
</template>
