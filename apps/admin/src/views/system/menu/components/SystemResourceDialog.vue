<script setup lang="ts">
import type {
  CreateSystemResourcePayload,
  SystemResource,
  UpdateSystemResourcePayload,
} from '@/api/system/resource'

defineOptions({ name: 'SystemResourceDialog' })

const props = withDefaults(
  defineProps<{
    editing?: SystemResource
    modelValue: boolean
    moduleOptions?: Array<{ label: string; value: string }>
    saving?: boolean
  }>(),
  { editing: undefined, moduleOptions: () => [], saving: false },
)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', value: CreateSystemResourcePayload | UpdateSystemResourcePayload): void
}>()

const form = reactive({
  description: '',
  key: '',
  module: '',
  name: '',
  sort: 0,
  viewDescription: '',
  viewName: '',
})
const errors = ref<Record<string, string>>({})
const title = computed(() => (props.editing ? '编辑资源' : '新建资源'))

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    const resource = props.editing
    const view = resource?.permissions.find(({ action }) => action === 'view')
    Object.assign(form, {
      description: resource?.description ?? '',
      key: resource?.key ?? '',
      module: resource?.module ?? '',
      name: resource?.name ?? '',
      sort: resource?.sort ?? 0,
      viewDescription: view?.description ?? '',
      viewName: view?.name ?? '',
    })
    errors.value = {}
  },
)

function submit() {
  errors.value = {}
  if (!form.name.trim()) errors.value.name = '请输入资源名称'
  if (!/^[a-z][A-Za-z0-9-]*$/.test(form.module)) {
    errors.value.module = '模块需以小写字母开头，可包含大小写字母、数字和连字符'
  }
  if (!props.editing && !/^[a-z][A-Za-z0-9-]*\.[a-z][A-Za-z0-9-]*$/.test(form.key)) {
    errors.value.key = '资源标识应类似 content.article'
  }
  if (!props.editing && !form.viewName.trim()) errors.value.viewName = '请输入查看权限名称'
  if (Object.keys(errors.value).length) return
  emit(
    'submit',
    props.editing
      ? {
          description: form.description.trim() || undefined,
          expectedUpdatedAt: props.editing.updatedAt,
          module: form.module.trim(),
          name: form.name.trim(),
          sort: form.sort,
        }
      : {
          description: form.description.trim() || undefined,
          key: form.key.trim(),
          module: form.module.trim(),
          name: form.name.trim(),
          sort: form.sort,
          viewDescription: form.viewDescription.trim() || undefined,
          viewName: form.viewName.trim(),
        },
  )
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    class="system-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    :title="title"
    width="min(720px, calc(100vw - 32px))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElForm
      id="resource-form"
      class="system-dialog-form"
      label-position="right"
      label-width="92px"
      @submit.prevent="submit"
    >
      <div class="system-dialog-grid">
        <ElFormItem label="资源名称" required :error="errors.name">
          <ElInput v-model="form.name" />
        </ElFormItem>
        <ElFormItem label="资源标识" required :error="errors.key">
          <ElInput
            v-model="form.key"
            class="system-readonly-field"
            :readonly="Boolean(editing)"
            placeholder="content.article"
            :title="editing ? '资源标识创建后不可修改' : undefined"
          />
        </ElFormItem>
        <ElFormItem label="所属模块" required :error="errors.module">
          <ElSelect
            v-model="form.module"
            allow-create
            default-first-option
            filterable
            placeholder="选择或输入模块标识"
          >
            <ElOption
              v-for="option in moduleOptions"
              :key="option.value"
              :label="`${option.label} · ${option.value}`"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort" :min="0" controls-position="right" />
        </ElFormItem>
        <ElFormItem v-if="!editing" label="查看权限" required :error="errors.viewName">
          <ElInput v-model="form.viewName" placeholder="查看文章" />
        </ElFormItem>
        <ElFormItem v-if="!editing" label="权限说明">
          <ElInput v-model="form.viewDescription" />
        </ElFormItem>
        <ElFormItem class="system-dialog-grid__wide" label="资源说明">
          <ElInput v-model="form.description" :rows="2" type="textarea" />
        </ElFormItem>
      </div>
      <p class="text-secondary m-0 text-xs">
        资源标识创建后不可修改；查看权限与资源一同创建并由资源统一维护。
      </p>
    </ElForm>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton form="resource-form" :loading="saving" native-type="submit" type="primary">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
