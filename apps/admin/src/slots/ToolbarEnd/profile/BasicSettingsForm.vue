<script setup lang="ts">
import { ElMessage, type FormInstance, type FormRules, type UploadProps } from 'element-plus'

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
const avatarUploading = ref(false)
const model = reactive<ProfileDraft>(createProfileDraft(userStore.profile!))

const rules: FormRules<ProfileDraft> = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 30, message: '昵称长度为 1 到 30 个字符', trigger: 'blur' },
  ],
}

const dirty = computed(() => Boolean(userStore.profile && isProfileDirty(model, userStore.profile)))
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
const profileMetaItems = computed(() => [
  {
    label: '登录账号',
    value: userStore.account || '未设置',
    icon: 'i-lucide:badge-check',
    tabular: false,
  },
  {
    label: '绑定手机',
    value: userStore.profile?.phone ?? '未绑定',
    icon: 'i-lucide:smartphone',
    tabular: false,
  },
  {
    label: '当前角色',
    value: roleNames.value,
    icon: 'i-lucide:shield-check',
    tabular: false,
  },
  {
    label: '最近登录',
    value: lastLoginAt.value,
    icon: 'i-lucide:clock-3',
    tabular: true,
  },
])

watch(dirty, (value) => emits('dirtyChange', value), { immediate: true })
watch(
  () => userStore.profile,
  (profile) => {
    if (!profile) return
    if (avatarUploading.value) {
      model.avatarUrl = profile.avatarUrl ?? ''
      return
    }
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

const uploadAvatar: UploadProps['httpRequest'] = async (options) => {
  avatarUploading.value = true
  try {
    const profile = await userStore.uploadAvatar(options.file as File)
    model.avatarUrl = profile.avatarUrl ?? ''
    options.onSuccess?.(profile)
    ElMessage.success('头像已更新')
  } catch (error) {
    throw error
  } finally {
    await nextTick()
    avatarUploading.value = false
  }
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
        <section class="bg-muted/20 border-border/70 rounded-lg border p-4 sm:p-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div class="shrink-0">
              <div class="text-foreground mb-2 text-sm font-medium">个人头像</div>
              <ImageUpload
                v-model="model.avatarUrl"
                action="#"
                :http-request="uploadAvatar"
                :width="88"
                :height="88"
                :size="5"
                :ext="['jpg', 'jpeg', 'png', 'gif', 'webp']"
                notip
              />
            </div>
            <div class="min-w-0 flex-1">
              <ElFormItem label="昵称" prop="nickname" class="mb-0!">
                <ElInput
                  v-model="model.nickname"
                  maxlength="30"
                  show-word-limit
                  autocomplete="nickname"
                  placeholder="请输入昵称"
                />
              </ElFormItem>
              <p class="text-muted-foreground mt-2 text-xs leading-5">
                头像支持 jpg、jpeg、png、gif、webp，单张不超过 5MB。
              </p>
            </div>
          </div>
        </section>

        <section class="pt-6">
          <h3 class="text-foreground mb-4 text-base font-semibold">账号概览</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="item in profileMetaItems"
              :key="item.label"
              class="bg-muted/30 border-border/70 min-h-18 flex gap-3 rounded-lg border p-3"
            >
              <span
                class="bg-background text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md border"
                aria-hidden="true"
              >
                <FaIcon :name="item.icon" class="size-4" />
              </span>
              <span class="min-w-0">
                <span class="text-muted-foreground block text-xs">{{ item.label }}</span>
                <span
                  class="text-foreground mt-1 block break-words text-sm font-medium leading-5"
                  :class="{ 'tabular-nums': item.tabular }"
                >
                  {{ item.value }}
                </span>
              </span>
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
