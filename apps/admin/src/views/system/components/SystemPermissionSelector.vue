<script setup lang="ts">
import type { SystemResource } from '@/api/system/resource'

import { groupSystemResources } from './system-resource-groups'

interface PermissionTreeNode {
  children?: PermissionTreeNode[]
  code: string
  disabled?: boolean
  key: string
  kind: 'module' | 'permission' | 'resource'
  name: string
  permissionId?: number
}

interface PermissionTreeCheckState {
  checkedKeys: Array<number | string>
}

interface PermissionTreeInstance {
  filter: (value: string) => void
  getNode: (key: string) => PermissionTreeNodeInstance | undefined
  setCheckedKeys: (keys: string[]) => void
}

interface PermissionTreeNodeInstance {
  data?: PermissionTreeNode
  expand: () => void
  parent?: PermissionTreeNodeInstance
}

const props = defineProps<{
  modelValue: number[]
  resources: SystemResource[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const treeRef = ref<PermissionTreeInstance>()
const filterQuery = ref('')
const groups = computed(() => groupSystemResources(props.resources))
const availablePermissions = computed(() =>
  props.resources.flatMap((resource) =>
    resource.status === 'active'
      ? resource.permissions.filter(({ status }) => status === 'active')
      : [],
  ),
)
const availablePermissionIds = computed(
  () => new Set(availablePermissions.value.map(({ id }) => id)),
)
const selectedCount = computed(
  () => props.modelValue.filter((id) => availablePermissionIds.value.has(id)).length,
)

const treeData = computed<PermissionTreeNode[]>(() =>
  groups.value.map((group) => {
    const resources = group.resources.map<PermissionTreeNode>((resource) => {
      const resourceDisabled = resource.status !== 'active'
      const permissions = resource.permissions.map<PermissionTreeNode>((permission) => ({
        code: permission.code,
        disabled: resourceDisabled || permission.status !== 'active',
        key: `permission:${permission.id}`,
        kind: 'permission',
        name: permission.name,
        permissionId: permission.id,
      }))
      return {
        children: permissions,
        code: resource.key,
        disabled: resourceDisabled || permissions.every(({ disabled }) => disabled),
        key: `resource:${resource.id}`,
        kind: 'resource',
        name: resource.name,
      }
    })
    return {
      children: resources,
      code: group.code,
      disabled: resources.every(({ disabled }) => disabled),
      key: `module:${group.code}`,
      kind: 'module',
      name: group.label,
    }
  }),
)

const permissionIdByKey = computed<Map<string, number>>(
  () =>
    new Map(
      props.resources.flatMap((resource) =>
        resource.permissions.map(({ id }) => [`permission:${id}`, id] as const),
      ),
    ),
)
const checkedPermissionKeys = computed(() =>
  props.modelValue
    .filter((id) => availablePermissionIds.value.has(id))
    .map((id) => `permission:${id}`),
)
const defaultExpandedKeys = computed(() => groups.value.map(({ code }) => `module:${code}`))

function normalizePermissionIds(value: Iterable<number>) {
  const next = new Set(value)
  const previous = new Set(props.modelValue)
  for (const resource of props.resources) {
    const view = resource.permissions.find(({ action }) => action === 'view')
    if (!view) continue
    const actions = resource.permissions
      .filter(({ action }) => action !== 'view')
      .map(({ id }) => id)
    if (
      actions.some((id) => next.has(id) && !previous.has(id)) &&
      view.status === 'active' &&
      resource.status === 'active'
    ) {
      next.add(view.id)
    }
    if (previous.has(view.id) && !next.has(view.id)) {
      actions.forEach((id) => next.delete(id))
    }
  }
  return [...next].filter((id) => availablePermissionIds.value.has(id))
}

function syncCheckedKeys(keys = checkedPermissionKeys.value) {
  void nextTick(() => treeRef.value?.setCheckedKeys(keys))
}

function updateSelection(_node: PermissionTreeNode, state: PermissionTreeCheckState) {
  const permissionIds = state.checkedKeys.flatMap((key) => {
    const id = permissionIdByKey.value.get(String(key))
    return id ? [id] : []
  })
  const normalized = normalizePermissionIds(permissionIds)
  emit('update:modelValue', normalized)
  syncCheckedKeys(normalized.map((id) => `permission:${id}`))
}

function filterNode(value: string, data: Record<string, unknown>) {
  const query = value.trim().toLocaleLowerCase()
  const name = String(data.name ?? '').toLocaleLowerCase()
  const code = String(data.code ?? '').toLocaleLowerCase()
  return !query || name.includes(query) || code.includes(query)
}

function matchingNodeKeys(nodes: PermissionTreeNode[], query: string): string[] {
  return nodes.flatMap((node) => [
    ...(filterNode(query, node as unknown as Record<string, unknown>) ? [node.key] : []),
    ...matchingNodeKeys(node.children ?? [], query),
  ])
}

async function filterTree(value: string) {
  treeRef.value?.filter(value)
  const query = value.trim()
  if (!query) return
  await nextTick()
  for (const key of matchingNodeKeys(treeData.value, query)) {
    let node = treeRef.value?.getNode(key)
    while (node) {
      node.expand()
      node = node.parent
    }
  }
}

watch([checkedPermissionKeys, treeData], () => syncCheckedKeys(), { immediate: true })
watch(filterQuery, (value) => void filterTree(value))
</script>

<template>
  <section v-if="treeData.length" class="system-permission-selector">
    <header class="system-permission-tree__summary">
      <span>按模块和资源选择权限</span>
      <span>{{ selectedCount }} / {{ availablePermissions.length }} 项已选</span>
    </header>
    <ElInput v-model="filterQuery" clearable placeholder="搜索模块、资源、权限名称或编码">
      <template #prefix><FaIcon name="i-ri:search-line" /></template>
    </ElInput>
    <ElTree
      ref="treeRef"
      :data="treeData"
      :default-expanded-keys="defaultExpandedKeys"
      :expand-on-click-node="true"
      :filter-node-method="filterNode"
      node-key="key"
      show-checkbox
      empty-text="没有匹配的权限"
      @check="updateSelection"
    >
      <template #default="{ data }">
        <span class="system-permission-tree__node" :class="`is-${data.kind}`">
          <span class="system-permission-tree__name" :title="data.name">{{ data.name }}</span>
          <code class="system-permission-tree__code" :title="data.code">{{ data.code }}</code>
          <ElTag v-if="data.disabled" effect="plain" size="small" type="info">停用</ElTag>
        </span>
      </template>
    </ElTree>
  </section>
  <p v-else class="system-dialog-empty">暂无可选权限</p>
</template>
