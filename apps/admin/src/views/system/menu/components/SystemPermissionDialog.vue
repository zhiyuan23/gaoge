<script setup lang="ts">
import type { SystemPermission, SystemResource } from '@/api/system/resource'

import type { PermissionFormValue } from './system-access-forms'

defineOptions({ name: 'SystemPermissionDialog' })

const props = withDefaults(
  defineProps<{
    editing?: SystemPermission & { roles?: { id: number; code: string; name: string }[] }
    modelValue: boolean
    resource?: SystemResource
    saving?: boolean
  }>(),
  { editing: undefined, resource: undefined, saving: false },
)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', value: PermissionFormValue): void
}>()

const form = reactive<PermissionFormValue>({
  action: '',
  description: '',
  name: '',
  status: 'active',
})
const errors = ref<Record<string, string>>({})
const title = computed(() => (props.editing ? '编辑权限' : '新建操作权限'))
const code = computed(
  () =>
    props.editing?.code ??
    (props.resource && form.action ? `${props.resource.key}.${form.action}` : ''),
)
const actionOptions = [
  { label: '新建', value: 'create' },
  { label: '编辑', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '启用', value: 'enable' },
  { label: '停用', value: 'disable' },
  { label: '发布', value: 'publish' },
  { label: '预览', value: 'preview' },
  { label: '上传', value: 'upload' },
  { label: '分配权限', value: 'assign-permission' },
  { label: '重置密码', value: 'reset-password' },
]

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    Object.assign(form, {
      action: props.editing?.action ?? '',
      description: props.editing?.description ?? '',
      name: props.editing?.name ?? '',
      status: props.editing?.status ?? 'active',
    })
    errors.value = {}
  },
)

function submit() {
  errors.value = {}
  if (!form.name.trim()) errors.value.name = '请输入权限名称'
  if (!props.editing && (!/^[a-z][A-Za-z0-9-]*$/.test(form.action) || form.action === 'view')) {
    errors.value.action = '操作标识格式不正确，且不能为 view'
  }
  if (!props.resource) errors.value.resource = '请选择所属资源'
  if (Object.keys(errors.value).length) return
  emit('submit', {
    action: form.action.trim(),
    description: form.description.trim(),
    name: form.name.trim(),
    status: form.status,
  })
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    class="system-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    :title="title"
    width="min(640px, calc(100vw - 32px))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElForm
      id="permission-form"
      class="system-dialog-form"
      label-position="right"
      label-width="88px"
      @submit.prevent="submit"
    >
      <div class="system-dialog-grid">
        <ElFormItem label="权限名称" required :error="errors.name">
          <ElInput v-model="form.name" />
        </ElFormItem>
        <ElFormItem label="所属资源" required :error="errors.resource">
          <ElInput class="system-readonly-field" :model-value="resource?.name" readonly />
        </ElFormItem>
        <ElFormItem v-if="!editing" label="操作标识" required :error="errors.action">
          <ElSelect
            v-model="form.action"
            allow-create
            default-first-option
            filterable
            placeholder="选择或输入操作标识"
          >
            <ElOption
              v-for="option in actionOptions"
              :key="option.value"
              :label="`${option.label} · ${option.value}`"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status" :disabled="editing?.action === 'view'">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem class="system-dialog-grid__wide" label="完整编码">
          <ElInput class="system-readonly-field" :model-value="code" readonly />
        </ElFormItem>
        <ElFormItem class="system-dialog-grid__wide" label="说明">
          <ElInput v-model="form.description" :rows="2" type="textarea" />
        </ElFormItem>
      </div>
    </ElForm>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton form="permission-form" :loading="saving" native-type="submit" type="primary">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
