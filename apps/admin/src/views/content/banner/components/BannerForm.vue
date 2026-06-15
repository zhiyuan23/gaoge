<script setup lang="ts">
import type { FormInstance, UploadRequestOptions } from 'element-plus'

import bannerApi from '@/api/content/banner'

import type { BannerFormModel } from '../model/types'
import {
  BANNER_JUMP_TYPE_OPTIONS,
  BANNER_STATUS_OPTIONS,
  createBannerFormRules,
} from '../schemas/form'

defineOptions({
  name: 'BannerForm',
})

const model = defineModel<BannerFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const formRules = computed(() => createBannerFormRules(model.value))

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false)
  return Boolean(valid)
}

function clearValidate() {
  formRef.value?.clearValidate()
}

async function uploadRequest(options: UploadRequestOptions) {
  try {
    const payload = await bannerApi.uploadImage(options.file as File)
    options.onSuccess?.(payload as any)
  } catch (error) {
    const uploadError = Object.assign(new Error('Banner 图片上传失败'), {
      status: 500,
      method: 'POST',
      url: '/content/banners/upload-image',
      cause: error,
    })

    options.onError?.(uploadError)
  }
}

function handleUploadSuccess(payload: { imageUrl: string }) {
  model.value.imageUrl = payload.imageUrl
}

watch(
  () => model.value.jumpType,
  (value) => {
    if (value === 'none') {
      model.value.jumpUrl = ''
    }
  },
)

defineExpose({
  validate,
  clearValidate,
})
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="formRules" label-width="108px" class="gaoge-form">
    <ElRow :gutter="16">
      <ElCol :span="24">
        <ElFormItem label="Banner 标题" prop="title">
          <ElInput v-model="model.title" placeholder="请输入 Banner 标题" />
        </ElFormItem>
      </ElCol>

      <ElCol :span="24">
        <ElFormItem label="Banner 图片" prop="imageUrl">
          <div class="flex w-full flex-col gap-12">
            <ImageUpload
              v-model="model.imageUrl"
              action="#"
              :http-request="uploadRequest"
              :width="240"
              :height="120"
              @on-success="handleUploadSuccess"
            />
            <ElInput v-model="model.imageUrl" placeholder="可直接填写图片链接" />
            <ElImage
              v-if="model.imageUrl"
              :src="model.imageUrl"
              fit="cover"
              class="h-120 w-240 rounded-8 border border-[var(--el-border-color-lighter)]"
            />
          </div>
        </ElFormItem>
      </ElCol>

      <ElCol :span="12">
        <ElFormItem label="跳转类型">
          <ElSelect v-model="model.jumpType" class="w-full">
            <ElOption
              v-for="item in BANNER_JUMP_TYPE_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>

      <ElCol :span="12">
        <ElFormItem label="排序" prop="sort">
          <ElInputNumber v-model="model.sort" :min="0" :max="999" class="w-full" />
        </ElFormItem>
      </ElCol>

      <ElCol :span="24">
        <ElFormItem v-if="model.jumpType !== 'none'" label="跳转链接" prop="jumpUrl">
          <ElInput
            v-model="model.jumpUrl"
            :placeholder="
              model.jumpType === 'webview'
                ? '请填写 http:// 或 https:// 开头的链接'
                : '请填写以 /pages/ 开头的小程序页面路径'
            "
          />
        </ElFormItem>
      </ElCol>

      <ElCol :span="12">
        <ElFormItem label="状态">
          <ElSelect v-model="model.status" class="w-full">
            <ElOption
              v-for="item in BANNER_STATUS_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>
