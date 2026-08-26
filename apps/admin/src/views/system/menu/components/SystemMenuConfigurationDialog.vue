<script setup lang="ts">
import { ElMessageBox } from 'element-plus'

import type { SystemMenuType } from '@gaoge/shared-types'

import type { SystemMenu } from '@/api/system/menu'
import type { SystemResource } from '@/api/system/resource'

import type { MenuConfigurationFormValue } from './system-access-forms'

defineOptions({ name: 'SystemMenuConfigurationDialog' })

const props = withDefaults(
  defineProps<{
    editing?: SystemMenu
    initialParentId?: number | null
    initialType?: SystemMenuType
    menus: SystemMenu[]
    modelValue: boolean
    resources: SystemResource[]
    saving?: boolean
  }>(),
  {
    editing: undefined,
    initialParentId: null,
    initialType: 'menu',
    saving: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', value: MenuConfigurationFormValue): void
}>()

const form = reactive<MenuConfigurationFormValue>({
  icon: '',
  menuType: 'menu',
  name: '',
  parentId: null,
  path: '',
  resourceIds: [],
  routeName: '',
  sort: 0,
  status: 'active',
  title: '',
  visible: true,
})
const fieldErrors = ref<Record<string, string>>({})
const activeResources = computed(() => props.resources.filter(({ status }) => status === 'active'))
const directories = computed(() =>
  props.menus.filter(
    ({ id, menuType }) =>
      (menuType === 'group' || menuType === 'catalog') && id !== props.editing?.id,
  ),
)
const title = computed(() =>
  props.editing
    ? `编辑${form.menuType === 'group' ? '分组' : form.menuType === 'catalog' ? '目录' : '页面'}`
    : `新建${form.menuType === 'group' ? '分组' : form.menuType === 'catalog' ? '目录' : '页面'}`,
)
const iconOptions = computed(() => {
  const defaults = [
    'ri:dashboard-line',
    'ri:article-line',
    'ri:file-list-3-line',
    'ri:folder-3-line',
    'ri:image-line',
    'ri:settings-3-line',
    'ri:user-line',
    'ri:shield-user-line',
    'ri:menu-line',
    'ri:file-history-line',
    'ri:file-search-line',
  ]
  return [...new Set([...defaults, ...props.menus.flatMap(({ icon }) => (icon ? [icon] : []))])]
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    const editing = props.editing
    Object.assign(form, {
      expectedUpdatedAt: editing?.updatedAt,
      icon: editing?.icon ?? '',
      menuType: editing?.menuType ?? props.initialType,
      name: editing?.name ?? '',
      parentId: editing?.parentId ?? props.initialParentId,
      path: editing?.path ?? '',
      resourceIds: editing?.resources.map(({ id }) => id) ?? [],
      routeName: editing?.routeName ?? '',
      sort: editing?.sort ?? 0,
      status: editing?.status ?? 'active',
      title: editing?.title ?? '',
      visible: editing?.visible ?? true,
    })
    fieldErrors.value = {}
  },
)

watch(
  () => form.menuType,
  (type) => {
    if (type !== 'menu') form.resourceIds = []
  },
)

async function submit() {
  fieldErrors.value = {}
  if (!form.title.trim()) fieldErrors.value.title = '请输入菜单标题'
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(form.name)) {
    fieldErrors.value.name = '菜单标识需使用字母、数字、下划线或连字符'
  }
  if (form.menuType !== 'group' && !form.path?.trim()) fieldErrors.value.path = '请输入菜单路径'
  if (!form.routeName.trim()) fieldErrors.value.routeName = '请输入路由名'
  if (Object.keys(fieldErrors.value).length) return
  const newlyOpenToAll =
    form.menuType === 'menu' &&
    form.resourceIds.length === 0 &&
    (!props.editing || props.editing.resources.length > 0)
  if (newlyOpenToAll) {
    try {
      await ElMessageBox.confirm(
        '该页面未关联任何资源，保存后所有已登录用户都可以看到。确认按开放访问保存？',
        '确认页面访问范围',
        {
          confirmButtonText: '确认开放访问',
          cancelButtonText: '返回选择资源',
          type: 'warning',
        },
      )
    } catch {
      return
    }
  }
  emit('submit', {
    ...form,
    icon: form.icon.trim(),
    name: form.name.trim(),
    path: form.menuType === 'group' ? null : (form.path?.trim() ?? ''),
    routeName: form.routeName.trim(),
    title: form.title.trim(),
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
    width="min(760px, calc(100vw - 32px))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElForm
      id="menu-configuration-form"
      class="system-dialog-form"
      label-position="right"
      label-width="88px"
      @submit.prevent="submit"
    >
      <div class="system-dialog-grid">
        <ElFormItem label="标题" required :error="fieldErrors.title">
          <ElInput v-model="form.title" />
        </ElFormItem>
        <ElFormItem label="菜单标识" required :error="fieldErrors.name">
          <ElInput
            v-model="form.name"
            class="system-readonly-field"
            :readonly="Boolean(editing)"
            :title="editing ? '菜单标识创建后不可修改' : undefined"
          />
        </ElFormItem>
        <ElFormItem label="类型" required>
          <ElSelect v-model="form.menuType" :disabled="Boolean(editing)">
            <ElOption label="分组" value="group" />
            <ElOption label="目录" value="catalog" />
            <ElOption label="页面" value="menu" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="上级目录">
          <ElSelect
            v-model="form.parentId"
            clearable
            :disabled="Boolean(editing?.isBuiltIn)"
            filterable
            placeholder="顶级"
          >
            <ElOption
              v-for="menu in directories"
              :key="menu.id"
              :label="menu.title"
              :value="menu.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="路径" required :error="fieldErrors.path">
          <ElInput
            v-model="form.path"
            :disabled="form.menuType === 'group'"
            placeholder="/system/example"
            :readonly="Boolean(editing?.isBuiltIn)"
          />
        </ElFormItem>
        <ElFormItem label="路由名" required :error="fieldErrors.routeName">
          <ElInput
            v-model="form.routeName"
            class="system-readonly-field"
            :readonly="Boolean(editing?.isBuiltIn)"
          />
        </ElFormItem>
        <ElFormItem label="图标标识">
          <ElSelect
            v-model="form.icon"
            allow-create
            clearable
            default-first-option
            filterable
            placeholder="选择或输入图标标识"
          >
            <template #prefix><FaIcon v-if="form.icon" :name="form.icon" /></template>
            <ElOption v-for="icon in iconOptions" :key="icon" :label="icon" :value="icon">
              <span class="system-icon-option"
                ><FaIcon :name="icon" /><code>{{ icon }}</code></span
              >
            </ElOption>
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort" :min="0" controls-position="right" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="form.status">
            <ElOption label="启用" value="active" />
            <ElOption label="停用" value="inactive" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="导航可见">
          <ElSwitch v-model="form.visible" />
        </ElFormItem>
      </div>

      <section v-if="form.menuType === 'menu'" class="system-dialog-section">
        <p class="system-dialog-section__label">页面资源（拥有任一资源的查看权限即可显示）</p>
        <ElSelect
          v-model="form.resourceIds"
          class="w-full"
          clearable
          collapse-tags
          collapse-tags-tooltip
          :disabled="Boolean(editing?.isBuiltIn)"
          filterable
          multiple
          placeholder="不选择则登录后可见"
        >
          <ElOption
            v-for="resource in activeResources"
            :key="resource.id"
            :label="`${resource.name} · ${resource.key}`"
            :value="resource.id"
          />
        </ElSelect>
        <div v-if="form.resourceIds.length === 0" class="open-access-warning" role="status">
          <FaIcon name="i-ri:alert-line" />
          <span>未关联资源：保存后所有已登录用户均可看到此页面。</span>
        </div>
      </section>
      <p v-if="editing?.isBuiltIn" class="text-secondary m-0 text-xs">
        内置菜单的标识、类型、路径、父级和资源绑定由版本控制；标题、图标、排序、状态和显隐可在此配置。
      </p>
    </ElForm>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton
        form="menu-configuration-form"
        :loading="saving"
        native-type="submit"
        type="primary"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
