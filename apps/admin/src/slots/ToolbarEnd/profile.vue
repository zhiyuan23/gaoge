<script setup lang="ts">
import { ElMessageBox } from 'element-plus'

import EditPasswordForm from '@/components/business/AccountForm/EditPasswordForm.vue'
import useUserStore from '@/store/user'

import BasicSettingsForm from './profile/BasicSettingsForm.vue'

type ProfileSection = 'basic' | 'security'
type SettingsFormRef = { reset: () => void }

defineOptions({
  name: 'PersonalSettings',
})

const emits = defineEmits<{
  close: []
}>()

const userStore = useUserStore()
const active = ref<ProfileSection>('basic')
const basicFormRef = ref<SettingsFormRef>()
const securityFormRef = ref<SettingsFormRef>()
const loading = ref(false)
const dirtyBySection = reactive<Record<ProfileSection, boolean>>({
  basic: false,
  security: false,
})

const tabs: {
  key: ProfileSection
  title: string
  description: string
  icon: string
}[] = [
  {
    key: 'basic',
    title: '基本设置',
    description: '资料与头像',
    icon: 'i-lucide:user-round',
  },
  {
    key: 'security',
    title: '安全设置',
    description: '登录密码',
    icon: 'i-lucide:shield-check',
  },
]

const activeTab = computed(() => tabs.find((tab) => tab.key === active.value) ?? tabs[0])

onMounted(async () => {
  if (userStore.profile) return

  loading.value = true
  try {
    await userStore.getPermissions()
  } finally {
    loading.value = false
  }
})

async function confirmDiscard() {
  if (!dirtyBySection[active.value]) return true

  try {
    await ElMessageBox.confirm('当前修改尚未保存，确定放弃吗？', '未保存的修改', {
      type: 'warning',
      confirmButtonText: '放弃修改',
      cancelButtonText: '继续编辑',
    })
    return true
  } catch {
    return false
  }
}

function resetActiveForm() {
  const formRef = active.value === 'basic' ? basicFormRef.value : securityFormRef.value
  formRef?.reset()
  dirtyBySection[active.value] = false
}

async function requestSectionChange(section: ProfileSection) {
  if (section === active.value || !(await confirmDiscard())) return

  resetActiveForm()
  active.value = section
}

async function requestClose() {
  if (!(await confirmDiscard())) return

  resetActiveForm()
  emits('close')
}

function handlePasswordChanged() {
  emits('close')
  userStore.requestLogout()
}
</script>

<template>
  <div class="bg-background flex min-h-full w-full overflow-hidden">
    <aside class="bg-muted/30 w-18 shrink-0 border-e p-2 sm:w-52 sm:p-5" aria-label="个人设置分区">
      <div class="text-foreground mb-5 hidden px-2 text-lg font-semibold sm:block">个人设置</div>
      <nav class="space-y-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="focus-visible:ring-ring hover:bg-accent/60 flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-xl px-2 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 sm:justify-start sm:px-3"
          :class="{
            'bg-primary/10 text-primary hover:bg-primary/10': active === tab.key,
            'text-muted-foreground': active !== tab.key,
          }"
          :aria-current="active === tab.key ? 'page' : undefined"
          @click="requestSectionChange(tab.key)"
        >
          <span
            class="bg-background shadow-xs flex size-9 shrink-0 items-center justify-center rounded-lg border"
            aria-hidden="true"
          >
            <FaIcon :name="tab.icon" class="size-4" />
          </span>
          <span class="hidden min-w-0 sm:block">
            <span class="block text-sm font-medium">{{ tab.title }}</span>
            <span class="mt-0.5 block text-xs opacity-70">{{ tab.description }}</span>
          </span>
        </button>
      </nav>
    </aside>

    <section class="flex min-w-0 flex-1 flex-col">
      <header class="flex items-start justify-between gap-4 border-b px-4 py-5 sm:px-8">
        <div>
          <h2 class="text-foreground text-xl font-semibold">{{ activeTab.title }}</h2>
          <p class="text-muted-foreground mt-1 text-sm">
            {{
              active === 'basic' ? '管理你的个人资料和系统展示信息' : '更新登录密码并保护账号安全'
            }}
          </p>
        </div>
        <button
          type="button"
          class="focus-visible:ring-ring hover:bg-accent text-muted-foreground hover:text-foreground flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
          aria-label="关闭个人设置"
          @click="requestClose"
        >
          <FaIcon name="i-lucide:x" class="size-5" />
        </button>
      </header>

      <div v-if="loading" class="flex flex-1 items-center justify-center" aria-live="polite">
        <FaIcon name="i-line-md:loading-twotone-loop" class="text-primary size-8" />
        <span class="sr-only">正在加载个人资料</span>
      </div>
      <template v-else-if="userStore.profile">
        <BasicSettingsForm
          v-if="active === 'basic'"
          ref="basicFormRef"
          @dirty-change="dirtyBySection.basic = $event"
          @close="requestClose"
        />
        <EditPasswordForm
          v-else
          ref="securityFormRef"
          @dirty-change="dirtyBySection.security = $event"
          @close="requestClose"
          @password-changed="handlePasswordChanged"
        />
      </template>
    </section>
  </div>
</template>
