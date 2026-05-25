<route lang="yaml">
meta:
  title: 微信分享配置
</route>

<script setup lang="ts">
import { ElDialog, ElMessage, ElTag, type FormInstance, type FormRules } from 'element-plus'

import type {
  UpdateWechatShareAdminConfigPayload,
  WechatShareAdminConfig,
} from '@gaoge/shared-types'

import wechatShareApi from '@/api/system/wechat-share'

import { SYSTEM_WECHAT_SHARE_PERMISSIONS } from './auth'

defineOptions({
  name: 'SystemWechatShare',
})

type WechatShareFormData = WechatShareAdminConfig & {
  appSecret: string
}

type OfficialAccountFormData = {
  appId: string
  appSecret: string
  defaultImageUrl: string
}

type PageShareKey = 'home' | 'teams' | 'assets'

type PageShareRow = {
  key: PageShareKey
  label: string
  matchPath: string
  title: string
  desc: string
  imageUrl: string
}

type PageShareFormData = {
  key: PageShareKey
  label: string
  title: string
  desc: string
  imageUrl: string
}

const loading = ref(false)
const submitLoading = ref(false)
const officialAccountDialogVisible = ref(false)
const officialAccountSubmitLoading = ref(false)
const pageConfigDialogVisible = ref(false)
const officialAccountFormRef = ref<FormInstance>()
const pageConfigFormRef = ref<FormInstance>()
const currentEditingPageKey = ref<PageShareKey | null>(null)

const formData = reactive<WechatShareFormData>({
  appId: '',
  appSecret: '',
  hasAppSecret: false,
  defaultImageUrl: '',
  homeTitle: '',
  homeDesc: '',
  homeImageUrl: '',
  teamsTitle: '',
  teamsDesc: '',
  teamsImageUrl: '',
  assetsTitle: '',
  assetsDesc: '',
  assetsImageUrl: '',
})

const officialAccountForm = reactive<OfficialAccountFormData>({
  appId: '',
  appSecret: '',
  defaultImageUrl: '',
})

const pageConfigForm = reactive<PageShareFormData>({
  key: 'home',
  label: '',
  title: '',
  desc: '',
  imageUrl: '',
})

const pageConfigRows = reactive<PageShareRow[]>([
  {
    key: 'home',
    label: '首页',
    matchPath: '/',
    title: '',
    desc: '',
    imageUrl: '',
  },
  {
    key: 'teams',
    label: '球队页',
    matchPath: '/teams/:team?',
    title: '',
    desc: '',
    imageUrl: '',
  },
  {
    key: 'assets',
    label: '资产页',
    matchPath: '/teams/football/assets',
    title: '',
    desc: '',
    imageUrl: '',
  },
])

const validateHttpsUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

const requiredHttpsValidator = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void,
) => {
  if (!value) {
    callback(new Error('请填写 https:// 地址'))
    return
  }

  if (!validateHttpsUrl(value)) {
    callback(new Error('请输入有效的 https:// 地址'))
    return
  }

  callback()
}

const officialAccountRules: FormRules<OfficialAccountFormData> = {
  appId: [{ required: true, message: '请输入 AppID', trigger: 'blur' }],
  defaultImageUrl: [{ validator: requiredHttpsValidator, trigger: 'blur' }],
}

const pageConfigRules: FormRules<PageShareFormData> = {
  title: [{ required: true, message: '请输入分享标题', trigger: 'blur' }],
  desc: [{ required: true, message: '请输入分享简介', trigger: 'blur' }],
  imageUrl: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback()
          return
        }

        if (!validateHttpsUrl(String(value))) {
          callback(new Error('请输入有效的 https:// 地址'))
          return
        }

        callback()
      },
      trigger: 'blur',
    },
  ],
}

function applyConfig(config: WechatShareAdminConfig) {
  formData.appId = config.appId
  formData.appSecret = ''
  formData.hasAppSecret = config.hasAppSecret
  formData.defaultImageUrl = config.defaultImageUrl
  syncOfficialAccountForm()
  syncPageConfigRows(config)
}

function buildPayload(): UpdateWechatShareAdminConfigPayload {
  const homeRow = findPageRow('home')
  const teamsRow = findPageRow('teams')
  const assetsRow = findPageRow('assets')

  return {
    appId: formData.appId.trim(),
    appSecret: formData.appSecret.trim(),
    defaultImageUrl: formData.defaultImageUrl.trim(),
    homeTitle: homeRow.title.trim(),
    homeDesc: homeRow.desc.trim(),
    homeImageUrl: homeRow.imageUrl.trim(),
    teamsTitle: teamsRow.title.trim(),
    teamsDesc: teamsRow.desc.trim(),
    teamsImageUrl: teamsRow.imageUrl.trim(),
    assetsTitle: assetsRow.title.trim(),
    assetsDesc: assetsRow.desc.trim(),
    assetsImageUrl: assetsRow.imageUrl.trim(),
  }
}

function syncPageConfigRows(config: WechatShareAdminConfig) {
  const homeRow = findPageRow('home')
  const teamsRow = findPageRow('teams')
  const assetsRow = findPageRow('assets')

  homeRow.title = config.homeTitle
  homeRow.desc = config.homeDesc
  homeRow.imageUrl = config.homeImageUrl

  teamsRow.title = config.teamsTitle
  teamsRow.desc = config.teamsDesc
  teamsRow.imageUrl = config.teamsImageUrl

  assetsRow.title = config.assetsTitle
  assetsRow.desc = config.assetsDesc
  assetsRow.imageUrl = config.assetsImageUrl
}

function syncOfficialAccountForm() {
  officialAccountForm.appId = formData.appId
  officialAccountForm.appSecret = ''
  officialAccountForm.defaultImageUrl = formData.defaultImageUrl
}

function findPageRow(key: PageShareKey) {
  const row = pageConfigRows.find((item) => item.key === key)
  if (!row) {
    throw new Error(`Missing page config row: ${key}`)
  }

  return row
}

function validatePageConfigRows() {
  for (const row of pageConfigRows) {
    if (!row.title.trim()) {
      return `${row.label}的分享标题不能为空`
    }

    if (!row.desc.trim()) {
      return `${row.label}的分享简介不能为空`
    }

    if (row.imageUrl.trim() && !validateHttpsUrl(row.imageUrl.trim())) {
      return `${row.label}的分享图 URL 必须是有效的 https:// 地址`
    }
  }

  return ''
}

function summarizeText(value: string, maxLength = 26) {
  const normalized = value.trim()

  if (!normalized) {
    return '未填写'
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}...`
}

function summarizeUrl(value: string, maxLength = 42) {
  const normalized = value.trim()

  if (!normalized) {
    return '未配置'
  }

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}...`
}

function openOfficialAccountDialog() {
  syncOfficialAccountForm()
  officialAccountDialogVisible.value = true
}

function openPageConfigDialog(row: PageShareRow) {
  currentEditingPageKey.value = row.key
  pageConfigForm.key = row.key
  pageConfigForm.label = row.label
  pageConfigForm.title = row.title
  pageConfigForm.desc = row.desc
  pageConfigForm.imageUrl = row.imageUrl
  pageConfigDialogVisible.value = true
}

async function fetchConfig() {
  loading.value = true
  try {
    const config = await wechatShareApi.detail()
    applyConfig(config)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const pageConfigError = validatePageConfigRows()
  if (pageConfigError) {
    ElMessage.error(pageConfigError)
    return
  }

  submitLoading.value = true
  try {
    const savedConfig = await wechatShareApi.update(buildPayload())
    applyConfig(savedConfig)
    ElMessage.success('微信分享配置已保存')
  } finally {
    submitLoading.value = false
  }
}

async function handlePageConfigSubmit() {
  const form = pageConfigFormRef.value
  if (!form) {
    return
  }

  await form.validate()

  const targetKey = currentEditingPageKey.value
  if (!targetKey) {
    return
  }

  const row = findPageRow(targetKey)
  row.title = pageConfigForm.title.trim()
  row.desc = pageConfigForm.desc.trim()
  row.imageUrl = pageConfigForm.imageUrl.trim()
  pageConfigDialogVisible.value = false
}

async function handleOfficialAccountSubmit() {
  const form = officialAccountFormRef.value
  if (!form) {
    return
  }

  await form.validate()

  const pageConfigError = validatePageConfigRows()
  if (pageConfigError) {
    ElMessage.error(pageConfigError)
    return
  }

  officialAccountSubmitLoading.value = true
  try {
    const savedConfig = await wechatShareApi.update({
      ...buildPayload(),
      appId: officialAccountForm.appId.trim(),
      appSecret: officialAccountForm.appSecret.trim(),
      defaultImageUrl: officialAccountForm.defaultImageUrl.trim(),
    })
    applyConfig(savedConfig)
    officialAccountDialogVisible.value = false
    ElMessage.success('公众号配置已保存')
  } finally {
    officialAccountSubmitLoading.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 overflow-auto">
      <div class="mx-auto flex max-w-6xl flex-col gap-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div class="text-base font-semibold">微信分享配置</div>
            <div class="text-sm text-[var(--el-text-color-secondary)]">
              保存后立即生效，前台下次初始化微信分享时将直接读取最新配置。
            </div>
          </div>
          <ElButton
            v-auth="SYSTEM_WECHAT_SHARE_PERMISSIONS.update"
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            保存页面配置
          </ElButton>
        </div>

        <div v-loading="loading" class="flex flex-col gap-4">
          <ElCard shadow="never">
            <template #header>
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div class="flex flex-col gap-1">
                  <span class="font-medium">公众号配置</span>
                  <span class="text-xs text-[var(--el-text-color-secondary)]">
                    当前只展示配置状态与摘要，编辑请通过弹窗完成。
                  </span>
                </div>
                <ElButton
                  v-auth="SYSTEM_WECHAT_SHARE_PERMISSIONS.update"
                  type="primary"
                  plain
                  @click="openOfficialAccountDialog"
                >
                  编辑公众号配置
                </ElButton>
              </div>
            </template>

            <div class="grid gap-4 lg:grid-cols-3">
              <div class="rounded-lg border border-[var(--el-border-color-light)] p-4">
                <div class="text-xs text-[var(--el-text-color-secondary)]">AppID</div>
                <div class="mt-2 break-all text-sm font-medium text-[var(--el-text-color-primary)]">
                  {{ formData.appId.trim() || '未配置' }}
                </div>
              </div>

              <div class="rounded-lg border border-[var(--el-border-color-light)] p-4">
                <div class="text-xs text-[var(--el-text-color-secondary)]">AppSecret 状态</div>
                <div class="mt-2 flex items-center gap-2">
                  <ElTag size="small" :type="formData.hasAppSecret ? 'success' : 'info'">
                    {{ formData.hasAppSecret ? '已配置' : '未配置' }}
                  </ElTag>
                  <span class="text-sm text-[var(--el-text-color-secondary)]">
                    {{
                      formData.hasAppSecret
                        ? '当前已保存公众号密钥'
                        : '未配置时微信分享签名不会生效'
                    }}
                  </span>
                </div>
              </div>

              <div class="rounded-lg border border-[var(--el-border-color-light)] p-4">
                <div class="text-xs text-[var(--el-text-color-secondary)]">默认分享图 URL</div>
                <div class="mt-2 break-all text-sm text-[var(--el-text-color-primary)]">
                  {{ summarizeUrl(formData.defaultImageUrl) }}
                </div>
                <div class="mt-3 text-xs leading-5 text-[var(--el-text-color-secondary)]">
                  页面未单独配置分享图时，自动回退到这张默认图片。
                </div>
              </div>
            </div>
          </ElCard>

          <ElCard header="页面分享配置" shadow="never">
            <template #header>
              <div class="flex flex-col gap-1">
                <span class="font-medium">页面分享配置</span>
                <span class="text-xs font-normal text-[var(--el-text-color-secondary)]">
                  每行代表一个页面类型。后续新增页面时，直接追加一行配置即可。
                </span>
              </div>
            </template>

            <ElTable :data="pageConfigRows" row-key="key" border stripe class="w-full">
              <ElTableColumn prop="label" label="页面" min-width="120" />
              <ElTableColumn prop="matchPath" label="路径匹配" min-width="220" />
              <ElTableColumn label="分享标题" min-width="220">
                <template #default="{ row }">
                  {{ row.title.trim() || '未填写' }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="分享简介" min-width="240">
                <template #default="{ row }">
                  <span class="text-[var(--el-text-color-secondary)]">
                    {{ summarizeText(row.desc) }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="分享图" width="140" align="center">
                <template #default="{ row }">
                  <ElTag size="small" :type="row.imageUrl.trim() ? 'success' : 'info'">
                    {{ row.imageUrl.trim() ? '自定义图片' : '使用默认图' }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="110" fixed="right" align="center">
                <template #default="{ row }">
                  <ElButton link type="primary" @click="openPageConfigDialog(row)">编辑</ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElCard>
        </div>
      </div>
    </FaPageMain>

    <ElDialog
      v-model="officialAccountDialogVisible"
      title="编辑公众号配置"
      width="640px"
      destroy-on-close
    >
      <ElForm
        ref="officialAccountFormRef"
        :model="officialAccountForm"
        :rules="officialAccountRules"
        label-position="top"
      >
        <ElFormItem label="AppID" prop="appId">
          <ElInput v-model="officialAccountForm.appId" placeholder="请输入公众号 AppID" clearable />
        </ElFormItem>

        <ElFormItem label="AppSecret" prop="appSecret">
          <ElInput
            v-model="officialAccountForm.appSecret"
            type="password"
            show-password
            placeholder="留空表示不修改当前 AppSecret"
            clearable
          />
          <div class="mt-2 text-xs text-[var(--el-text-color-secondary)]">
            AppSecret 只写不回显，关闭弹窗后不会保留未保存的输入值。
          </div>
        </ElFormItem>

        <ElFormItem label="默认分享图 URL" prop="defaultImageUrl" class="mb-0">
          <ElInput
            v-model="officialAccountForm.defaultImageUrl"
            placeholder="https://example.com/default-share.png"
            clearable
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="officialAccountDialogVisible = false">取消</ElButton>
          <ElButton
            v-auth="SYSTEM_WECHAT_SHARE_PERMISSIONS.update"
            type="primary"
            :loading="officialAccountSubmitLoading"
            @click="handleOfficialAccountSubmit"
          >
            保存公众号配置
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog
      v-model="pageConfigDialogVisible"
      :title="`编辑${pageConfigForm.label}分享配置`"
      width="720px"
      destroy-on-close
    >
      <ElForm
        ref="pageConfigFormRef"
        :model="pageConfigForm"
        :rules="pageConfigRules"
        label-position="top"
      >
        <div class="grid gap-4 lg:grid-cols-2">
          <ElFormItem :label="`${pageConfigForm.label}分享标题`" prop="title" class="mb-0">
            <ElInput
              v-model="pageConfigForm.title"
              :placeholder="`请输入${pageConfigForm.label}分享标题`"
              clearable
            />
          </ElFormItem>

          <ElFormItem :label="`${pageConfigForm.label}分享图 URL`" prop="imageUrl" class="mb-0">
            <ElInput
              v-model="pageConfigForm.imageUrl"
              placeholder="留空时回退到默认分享图"
              clearable
            />
          </ElFormItem>

          <ElFormItem
            :label="`${pageConfigForm.label}分享简介`"
            prop="desc"
            class="mb-0 lg:col-span-2"
          >
            <ElInput
              v-model="pageConfigForm.desc"
              type="textarea"
              :rows="4"
              :placeholder="`请输入${pageConfigForm.label}分享简介`"
            />
          </ElFormItem>
        </div>
      </ElForm>

      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="pageConfigDialogVisible = false">取消</ElButton>
          <ElButton
            v-auth="SYSTEM_WECHAT_SHARE_PERMISSIONS.update"
            type="primary"
            @click="handlePageConfigSubmit"
          >
            确认
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>
