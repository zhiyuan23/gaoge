<script setup lang="ts">
import { ElMessage, type FormInstance, type FormItemRule, type FormRules } from 'element-plus'

import useUserStore from '@/store/user'
import dayjs from '@/utils/dayjs'

import { buildProfilePayload, createProfileDraft, isProfileDirty, type ProfileDraft } from './model'

defineOptions({
  name: 'BasicSettingsForm',
})

const emits = defineEmits<{
  close: []
  dirtyChange: [dirty: boolean]
}>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const model = reactive<ProfileDraft>(createProfileDraft(userStore.profile!))

const validateAvatarUrl: FormItemRule['validator'] = (_rule, value: string, callback) => {
  const avatarUrl = value.trim()
  if (!avatarUrl) {
    callback()
    return
  }

  try {
    const url = new URL(avatarUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      callback(new Error('头像地址仅支持 http 或 https'))
      return
    }
    callback()
  } catch {
    callback(new Error('请输入有效的头像地址'))
  }
}

const rules: FormRules<ProfileDraft> = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 30, message: '昵称长度为 1 到 30 个字符', trigger: 'blur' },
  ],
  avatarUrl: [
    { max: 500, message: '头像地址不能超过 500 个字符', trigger: 'blur' },
    { validator: validateAvatarUrl, trigger: 'blur' },
  ],
}

const dirty = computed(() => Boolean(userStore.profile && isProfileDirty(model, userStore.profile)))
const avatarFallback = computed(() => userStore.displayName.slice(0, 2).toUpperCase())
const roleNames = computed(() => {
  if (userStore.roles.length > 0) {
    return userStore.roles.map((role) => role.name).join('、')
  }
  if (userStore.role === 'admin') return '管理员'
  if (userStore.role === 'viewer') return '只读成员'
  return '普通用户'
})
const lastLoginAt = computed(() =>
  userStore.profile?.lastLoginAt
    ? dayjs(userStore.profile.lastLoginAt).format('YYYY-MM-DD HH:mm')
    : '暂无记录',
)

watch(dirty, (value) => emits('dirtyChange', value), { immediate: true })
watch(
  () => userStore.profile,
  (profile) => {
    if (!profile) return
    Object.assign(model, createProfileDraft(profile))
    nextTick(() => formRef.value?.clearValidate())
  },
)

async function submit() {
  if (!userStore.profile) return

  await formRef.value?.validate()
  loading.value = true
  try {
    await userStore.updateProfile(buildProfilePayload(model))
    ElMessage.success('个人资料已更新')
    emits('close')
  } finally {
    loading.value = false
  }
}

function clearAvatar() {
  model.avatarUrl = ''
  formRef.value?.clearValidate('avatarUrl')
}

function reset() {
  if (!userStore.profile) return
  Object.assign(model, createProfileDraft(userStore.profile))
  formRef.value?.clearValidate()
}

defineExpose({
  reset,
})
</script>

<template>
  <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
    <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <ElForm
        ref="formRef"
        :model="model"
        :rules="rules"
        label-position="top"
        class="gaoge-form"
        scroll-to-error
      >
        <section class="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-center">
          <FaAvatar
            :src="model.avatarUrl.trim()"
            :fallback="avatarFallback"
            class="size-18 border-3 border-background ring-border shrink-0 rounded-2xl shadow-sm ring-1"
            shape="square"
          />
          <div class="min-w-0 flex-1">
            <ElFormItem label="个人头像" prop="avatarUrl" class="mb-0!">
              <div class="flex w-full flex-col gap-2 sm:flex-row">
                <ElInput
                  v-model="model.avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  aria-label="头像地址"
                />
                <FaButton
                  type="button"
                  variant="outline"
                  class="min-h-11 shrink-0"
                  @click="clearAvatar"
                >
                  清空
                </FaButton>
              </div>
            </ElFormItem>
            <p class="text-muted-foreground mt-2 text-xs leading-5">
              支持 http 或 https 图片地址；无法加载时将显示账号文字头像。
            </p>
          </div>
        </section>

        <section class="pt-6">
          <ElFormItem label="昵称" prop="nickname">
            <ElInput
              v-model="model.nickname"
              maxlength="30"
              show-word-limit
              autocomplete="nickname"
              placeholder="请输入昵称"
            />
          </ElFormItem>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <div class="text-foreground text-sm font-medium">登录账号</div>
              <div
                class="bg-muted/50 text-foreground flex min-h-11 items-center rounded-lg border px-3 text-sm"
              >
                {{ userStore.account || '未设置' }}
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-foreground text-sm font-medium">绑定手机</div>
              <div
                class="bg-muted/50 text-foreground flex min-h-11 items-center rounded-lg border px-3 text-sm"
              >
                {{ userStore.profile?.phone ?? '未绑定' }}
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-foreground text-sm font-medium">当前角色</div>
              <div
                class="bg-muted/50 text-foreground flex min-h-11 items-center rounded-lg border px-3 text-sm"
              >
                {{ roleNames }}
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-foreground text-sm font-medium">最近登录</div>
              <div
                class="bg-muted/50 text-foreground flex min-h-11 items-center rounded-lg border px-3 text-sm tabular-nums"
              >
                {{ lastLoginAt }}
              </div>
            </div>
          </div>
        </section>
      </ElForm>
    </div>

    <footer class="bg-muted/20 flex justify-end gap-3 border-t px-4 py-4 sm:px-8">
      <FaButton type="button" variant="outline" class="min-h-11" @click="emits('close')">
        取消
      </FaButton>
      <FaButton type="submit" class="min-h-11" :disabled="!dirty" :loading="loading">
        保存修改
      </FaButton>
    </footer>
  </form>
</template>
