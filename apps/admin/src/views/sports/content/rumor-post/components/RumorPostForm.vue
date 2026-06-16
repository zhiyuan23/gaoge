<script setup lang="ts">
import type { FormInstance } from 'element-plus'

import type { SearchOption } from '@/components/common/EsSearch/types'

import type { RumorPostFormModel } from '../model/types'
import { RUMOR_POST_FORM_RULES, RUMOR_POST_STATUS_OPTIONS } from '../schemas/form'

defineOptions({
  name: 'RumorPostForm',
})

const props = defineProps<{
  mode: 'create' | 'edit'
  tagOptions: SearchOption[]
}>()

const model = defineModel<RumorPostFormModel>('model', { required: true })
const formRef = ref<FormInstance>()

const mergedTagOptions = computed(() => {
  const base = props.tagOptions.map((item) => String(item.value))
  const current = model.value.tags ?? []

  return Array.from(new Set([...base, ...current])).map((value) => ({
    label: value,
    value,
  }))
})

const statusLocked = computed(() => props.mode === 'edit' && model.value.status === 'published')

async function validate() {
  const valid = await formRef.value?.validate().catch(() => false)
  return Boolean(valid)
}

function clearValidate() {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  clearValidate,
})
</script>

<template>
  <ElForm ref="formRef" :model="model" :rules="RUMOR_POST_FORM_RULES" label-width="96px">
    <ElRow :gutter="16">
      <ElCol :span="12">
        <ElFormItem label="标题" prop="title">
          <ElInput v-model="model.title" placeholder="请输入标题" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="来源" prop="sourceName">
          <ElInput v-model="model.sourceName" placeholder="例如 Fabrizio Romano" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="标签">
          <ElSelect
            v-model="model.tags"
            class="w-full"
            multiple
            filterable
            allow-create
            default-first-option
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="3"
            placeholder="请输入或选择标签"
          >
            <ElOption
              v-for="item in mergedTagOptions"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="12">
        <ElFormItem label="状态">
          <ElSelect v-model="model.status" class="w-full" :disabled="statusLocked">
            <ElOption
              v-for="item in RUMOR_POST_STATUS_OPTIONS"
              :key="String(item.value)"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="来源链接" prop="sourceUrl">
          <ElInput v-model="model.sourceUrl" placeholder="可选，填写 http(s):// 来源链接" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="正文" prop="content">
          <ElInput
            v-model="model.content"
            type="textarea"
            :rows="6"
            placeholder="请输入流言板正文"
          />
        </ElFormItem>
      </ElCol>
      <ElCol :span="24">
        <ElFormItem label="置顶">
          <ElSwitch v-model="model.isPinned" />
        </ElFormItem>
      </ElCol>
    </ElRow>
  </ElForm>
</template>
