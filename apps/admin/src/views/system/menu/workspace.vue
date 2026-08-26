<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'

import systemAccessCatalogApi from '@/api/system/access-catalog'
import type { SystemMenu } from '@/api/system/menu'
import systemMenuApi from '@/api/system/menu'
import type { SystemPermission } from '@/api/system/permission'
import systemPermissionApi from '@/api/system/permission'
import type {
  CreateSystemResourcePayload,
  SystemResource,
  UpdateSystemResourcePayload,
} from '@/api/system/resource'
import systemResourceApi from '@/api/system/resource'
import useAuth from '@/composables/useAuth'

import {
  filterSystemMenuTree,
  flattenSystemMenuTree,
  type SystemMenuTreeNode,
} from '../components/system-menu-tree'
import {
  buildSystemResourceTree,
  getSystemResourceModuleLabel,
  groupSystemResources,
  type SystemResourceTreeNode,
} from '../components/system-resource-groups'

import type {
  MenuConfigurationFormValue,
  PermissionFormValue,
} from './components/system-access-forms'
import SystemMenuConfigurationDialog from './components/SystemMenuConfigurationDialog.vue'
import SystemPermissionDialog from './components/SystemPermissionDialog.vue'
import SystemResourceDialog from './components/SystemResourceDialog.vue'
import { SYSTEM_MENU_PERMISSIONS } from './auth'
import { useSystemAccessWorkspaceMode } from './workspace-mode'

import '../system-rbac.css'

defineOptions({ name: 'SystemAccessWorkspace' })

const { authAll } = useAuth()
const route = useRoute()
const { mobileDetailOpen, mode, search, switchMode } = useSystemAccessWorkspaceMode()
watch(
  () => route.query.view,
  (view) => switchMode(view),
  { immediate: true },
)
const menuTreeSource = ref<SystemMenu[]>([])
const resources = ref<SystemResource[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const selectedMenuId = ref<number>()
const selectedResourceId = ref<number>()
const pendingKeys = ref(new Set<string>())

const menus = computed(() => flattenSystemMenuTree(menuTreeSource.value))
const menuTree = computed(() => filterSystemMenuTree(menuTreeSource.value, search.value))
const resourceTree = computed(() =>
  buildSystemResourceTree(
    resources.value.filter((resource) => {
      const query = search.value.trim().toLocaleLowerCase()
      return (
        !query ||
        resource.name.toLocaleLowerCase().includes(query) ||
        resource.key.toLocaleLowerCase().includes(query)
      )
    }),
  ),
)
const selectedMenu = computed(() => menus.value.find(({ id }) => id === selectedMenuId.value))
const selectedResource = computed(() =>
  resources.value.find(({ id }) => id === selectedResourceId.value),
)
const resourceModuleOptions = computed(() =>
  groupSystemResources(resources.value).map(({ code, label }) => ({ label, value: code })),
)
const canCreateMenu = computed(() =>
  authAll([SYSTEM_MENU_PERMISSIONS.create, SYSTEM_MENU_PERMISSIONS.assignPermission]),
)
const canEditMenu = computed(() =>
  authAll([SYSTEM_MENU_PERMISSIONS.update, SYSTEM_MENU_PERMISSIONS.assignPermission]),
)

const permissionActionIcons: Record<string, string> = {
  'assign-permission': 'i-ri:shield-keyhole-line',
  create: 'i-ri:add-circle-line',
  delete: 'i-ri:delete-bin-line',
  disable: 'i-ri:forbid-2-line',
  enable: 'i-ri:play-circle-line',
  preview: 'i-ri:file-search-line',
  publish: 'i-ri:send-plane-line',
  'reset-password': 'i-ri:key-2-line',
  'sync-builtins': 'i-ri:refresh-line',
  update: 'i-ri:edit-line',
  upload: 'i-ri:upload-cloud-2-line',
  view: 'i-ri:eye-line',
}

const menuDialogOpen = ref(false)
const editingMenu = ref<SystemMenu>()
const initialMenuType = ref<SystemMenu['menuType']>('menu')
const initialParentId = ref<number | null>(null)
const resourceDialogOpen = ref(false)
const editingResource = ref<SystemResource>()
const permissionDialogOpen = ref(false)
const editingPermission = ref<
  SystemPermission & { roles?: { id: number; code: string; name: string }[] }
>()

function setPending(key: string, pending: boolean) {
  const next = new Set(pendingKeys.value)
  if (pending) next.add(key)
  else next.delete(key)
  pendingKeys.value = next
}

function isPending(key: string) {
  return pendingKeys.value.has(key)
}

function isEntityBusy(kind: 'menu' | 'permission' | 'resource', id: number) {
  const prefix = `${kind}:${id}:`
  return [...pendingKeys.value].some((key) => key.startsWith(prefix))
}

function summarizeNames(items: Array<{ name?: string; title?: string }>) {
  if (!items.length) return '无'
  const names = items
    .slice(0, 4)
    .map(({ name, title }) => name ?? title)
    .filter(Boolean)
  return `${names.join('、')}${items.length > names.length ? ` 等 ${items.length} 项` : ''}`
}

function resourceImpact(resource: SystemResource) {
  return `关联菜单 ${resource.menuCount} 个（${summarizeNames(resource.menus)}），授权角色 ${resource.roleCount} 个（${summarizeNames(resource.roles)}）`
}

function permissionImpact(permission: SystemResource['permissions'][number]) {
  return `授权角色 ${permission.roles.length} 个（${summarizeNames(permission.roles)}）`
}

function isConflict(error: unknown) {
  const message = String(
    (error as { errMsg?: string; message?: string })?.errMsg ??
      (error as { message?: string })?.message ??
      '',
  )
  return message.includes('RBAC_CONCURRENT_MODIFICATION') || message.includes('并发冲突')
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const catalog = await systemAccessCatalogApi.get()
    menuTreeSource.value = catalog.menus
    resources.value = catalog.resources
    const flatMenus = flattenSystemMenuTree(catalog.menus)
    if (!flatMenus.some(({ id }) => id === selectedMenuId.value)) {
      selectedMenuId.value = flatMenus[0]?.id
    }
    if (!resources.value.some(({ id }) => id === selectedResourceId.value)) {
      selectedResourceId.value = resources.value[0]?.id
    }
  } catch {
    error.value = '菜单与权限加载失败，请重试。'
  } finally {
    loading.value = false
  }
}

function openCreateMenu(type: 'catalog' | 'menu', parentId: number | null = null) {
  editingMenu.value = undefined
  initialMenuType.value = type
  initialParentId.value = parentId
  menuDialogOpen.value = true
}

function openEditMenu(menu: SystemMenu) {
  editingMenu.value = menu
  initialMenuType.value = menu.menuType
  initialParentId.value = menu.parentId
  menuDialogOpen.value = true
}

function openCreateResource() {
  editingResource.value = undefined
  resourceDialogOpen.value = true
}

function openEditResource(resource: SystemResource) {
  editingResource.value = resource
  resourceDialogOpen.value = true
}

function openCreatePermission(resource: SystemResource) {
  editingPermission.value = undefined
  selectedResourceId.value = resource.id
  permissionDialogOpen.value = true
}

function openEditPermission(permission: SystemResource['permissions'][number]) {
  editingPermission.value = permission
  permissionDialogOpen.value = true
}

async function saveMenu(value: MenuConfigurationFormValue) {
  saving.value = true
  try {
    const payload = {
      icon: value.icon || undefined,
      menuType: value.menuType,
      name: value.name,
      parentId: value.parentId,
      path: value.path,
      resourceIds: value.menuType === 'catalog' ? [] : value.resourceIds,
      routeName: value.routeName,
      sort: value.sort,
      status: value.status,
      title: value.title,
      visible: value.visible,
    }
    if (editingMenu.value) {
      await systemMenuApi.update(editingMenu.value.id, {
        ...payload,
        expectedUpdatedAt: value.expectedUpdatedAt!,
      })
    } else {
      await systemMenuApi.create(payload)
    }
    menuDialogOpen.value = false
    ElMessage.success(editingMenu.value ? '菜单已更新' : '菜单已创建')
    await load()
  } catch (caught) {
    if (isConflict(caught) && editingMenu.value) {
      ElMessage.warning('菜单配置已变化，已刷新最新数据。')
      await load()
    }
  } finally {
    saving.value = false
  }
}

async function saveResource(value: CreateSystemResourcePayload | UpdateSystemResourcePayload) {
  saving.value = true
  try {
    if (editingResource.value) {
      await systemResourceApi.update(editingResource.value.id, value as UpdateSystemResourcePayload)
    } else {
      await systemResourceApi.create(value as CreateSystemResourcePayload)
    }
    resourceDialogOpen.value = false
    ElMessage.success(editingResource.value ? '资源已更新' : '资源已创建')
    await load()
  } finally {
    saving.value = false
  }
}

async function savePermission(value: PermissionFormValue) {
  if (!selectedResource.value) return
  saving.value = true
  try {
    if (editingPermission.value) {
      await systemPermissionApi.update(editingPermission.value.id, {
        description: value.description || undefined,
        expectedUpdatedAt: editingPermission.value.updatedAt,
        name: value.name,
        status: value.status,
      })
    } else {
      await systemResourceApi.createPermission(selectedResource.value.id, {
        action: value.action,
        description: value.description || undefined,
        name: value.name,
        status: value.status,
      })
    }
    permissionDialogOpen.value = false
    ElMessage.success(editingPermission.value ? '权限已更新' : '权限已创建')
    await load()
  } finally {
    saving.value = false
  }
}

async function toggleMenu(menu: SystemMenu) {
  const key = `menu:${menu.id}:status`
  setPending(key, true)
  try {
    await systemMenuApi.update(menu.id, {
      icon: menu.icon ?? undefined,
      menuType: menu.menuType,
      name: menu.name,
      parentId: menu.parentId,
      path: menu.path,
      resourceIds: menu.resources.map(({ id }) => id),
      routeName: menu.routeName,
      sort: menu.sort,
      status: menu.status === 'active' ? 'inactive' : 'active',
      title: menu.title,
      visible: menu.visible,
      expectedUpdatedAt: menu.updatedAt,
    })
    ElMessage.success(menu.status === 'active' ? '菜单已停用' : '菜单已启用')
    await load()
  } finally {
    setPending(key, false)
  }
}

async function toggleResource(resource: SystemResource) {
  if (resource.status === 'active') {
    try {
      await ElMessageBox.confirm(
        `停用资源「${resource.name}」后，其菜单入口和角色授权将不再生效。${resourceImpact(resource)}。确认停用？`,
        '停用资源',
        { confirmButtonText: '确认停用', type: 'warning' },
      )
    } catch {
      return
    }
  }
  const key = `resource:${resource.id}:status`
  setPending(key, true)
  try {
    await systemResourceApi.updateStatus(resource.id, {
      status: resource.status === 'active' ? 'inactive' : 'active',
      expectedUpdatedAt: resource.updatedAt,
    })
    ElMessage.success(resource.status === 'active' ? '资源已停用' : '资源已启用')
    await load()
  } finally {
    setPending(key, false)
  }
}

async function togglePermission(permission: SystemResource['permissions'][number]) {
  if (permission.status === 'active') {
    try {
      await ElMessageBox.confirm(
        `停用权限「${permission.name}」后，相关角色将失去该操作能力。${permissionImpact(permission)}。确认停用？`,
        '停用权限',
        { confirmButtonText: '确认停用', type: 'warning' },
      )
    } catch {
      return
    }
  }
  const key = `permission:${permission.id}:status`
  setPending(key, true)
  try {
    await systemPermissionApi.update(permission.id, {
      description: permission.description ?? undefined,
      expectedUpdatedAt: permission.updatedAt,
      name: permission.name,
      status: permission.status === 'active' ? 'inactive' : 'active',
    })
    ElMessage.success(permission.status === 'active' ? '权限已停用' : '权限已启用')
    await load()
  } finally {
    setPending(key, false)
  }
}

async function removeMenu(menu: SystemMenu) {
  const key = `menu:${menu.id}:delete`
  try {
    await ElMessageBox.confirm(`确认删除菜单「${menu.title}」？`, '删除菜单', {
      confirmButtonText: '确认删除',
      type: 'warning',
    })
    setPending(key, true)
    await systemMenuApi.remove(menu.id)
    ElMessage.success('菜单已删除')
    await load()
  } catch (caught) {
    if (caught !== 'cancel' && caught !== 'close') throw caught
  } finally {
    setPending(key, false)
  }
}

async function removeResource(resource: SystemResource) {
  const key = `resource:${resource.id}:delete`
  try {
    await ElMessageBox.confirm(
      `删除资源「${resource.name}」将同时删除其权限。${resourceImpact(resource)}。存在引用时服务端会拒绝删除，确认继续？`,
      '删除资源',
      { confirmButtonText: '确认删除', type: 'warning' },
    )
    setPending(key, true)
    await systemResourceApi.remove(resource.id)
    ElMessage.success('资源已删除')
    await load()
  } catch (caught) {
    if (caught !== 'cancel' && caught !== 'close') throw caught
  } finally {
    setPending(key, false)
  }
}

async function removePermission(permission: SystemResource['permissions'][number]) {
  const key = `permission:${permission.id}:delete`
  try {
    await ElMessageBox.confirm(
      `删除权限「${permission.name}」后无法恢复。${permissionImpact(permission)}。存在角色引用时服务端会拒绝删除，确认继续？`,
      '删除权限',
      { confirmButtonText: '确认删除', type: 'warning' },
    )
    setPending(key, true)
    await systemPermissionApi.remove(permission.id)
    ElMessage.success('权限已删除')
    await load()
  } catch (caught) {
    if (caught !== 'cancel' && caught !== 'close') throw caught
  } finally {
    setPending(key, false)
  }
}

async function syncBuiltins() {
  const key = 'catalog:sync'
  setPending(key, true)
  try {
    await systemPermissionApi.syncBuiltIns()
    ElMessage.success('内置资源、权限、角色和菜单已同步')
    await load()
  } finally {
    setPending(key, false)
  }
}

function selectMenu(data: SystemMenuTreeNode) {
  selectedMenuId.value = data.id
  mobileDetailOpen.value = true
}

function selectResource(id: number) {
  selectedResourceId.value = id
  mobileDetailOpen.value = true
}

function selectLinkedResource(id: number) {
  mode.value = 'resources'
  selectResource(id)
}

function selectResourceNode(data: SystemResourceTreeNode) {
  if (data.kind === 'resource') selectResource(data.id)
}

function showCatalog() {
  mobileDetailOpen.value = false
}

function permissionActionIcon(action: string) {
  return permissionActionIcons[action] ?? 'i-ri:command-line'
}

onMounted(load)
</script>

<template>
  <div class="absolute-container">
    <FaPageMain
      class="flex-1 overflow-auto"
      main-class="access-page-main flex-1 flex flex-col overflow-auto"
    >
      <div v-if="error" class="system-alert system-alert--danger" role="alert">
        <span>{{ error }}</span>
        <ElButton link type="danger" @click="load">重新加载</ElButton>
      </div>

      <div class="access-toolbar">
        <ElRadioGroup :model-value="mode" @change="switchMode">
          <ElRadioButton value="menus">菜单结构</ElRadioButton>
          <ElRadioButton value="resources">资源目录</ElRadioButton>
        </ElRadioGroup>
        <ElInput
          v-model="search"
          clearable
          :placeholder="mode === 'menus' ? '搜索菜单' : '搜索资源'"
        >
          <template #prefix><FaIcon name="i-ri:search-line" /></template>
        </ElInput>
        <div class="access-toolbar__actions">
          <ElButton
            v-auth="'system.permission.sync-builtins'"
            :disabled="isPending('catalog:sync')"
            :loading="isPending('catalog:sync')"
            plain
            @click="syncBuiltins"
          >
            <FaIcon name="i-ri:refresh-line" />同步内置配置
          </ElButton>
          <template v-if="mode === 'menus'">
            <ElButton v-if="canCreateMenu" plain @click="openCreateMenu('catalog')">
              <FaIcon name="i-ri:folder-add-line" />新建目录
            </ElButton>
            <ElButton v-if="canCreateMenu" type="primary" @click="openCreateMenu('menu')">
              <FaIcon name="i-ri:file-add-line" />新建页面
            </ElButton>
          </template>
          <ElButton
            v-else
            v-auth="'system.permission.create'"
            type="primary"
            @click="openCreateResource"
          >
            <FaIcon name="i-ri:add-circle-line" />新建资源
          </ElButton>
        </div>
      </div>

      <div
        v-loading="loading"
        class="access-workspace"
        :class="{ 'is-mobile-detail': mobileDetailOpen }"
      >
        <aside class="access-sidebar">
          <ElTree
            v-if="mode === 'menus'"
            :data="menuTree"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            :current-node-key="selectedMenuId"
            highlight-current
            @node-click="selectMenu"
          >
            <template #default="{ data }">
              <div class="menu-tree-node">
                <FaIcon
                  class="menu-tree-node__icon"
                  :name="
                    data.icon ||
                    (data.menuType === 'catalog' ? 'i-ri:folder-3-line' : 'i-ri:file-list-3-line')
                  "
                />
                <span class="menu-tree-node__title">{{ data.title }}</span>
                <span class="menu-tree-node__code">{{ data.name }}</span>
                <span v-if="data.status !== 'active'" class="menu-tree-node__muted">停</span>
              </div>
            </template>
          </ElTree>
          <ElTree
            v-else
            class="resource-tree"
            :data="resourceTree"
            node-key="id"
            default-expand-all
            :expand-on-click-node="true"
            :highlight-current="false"
            @node-click="selectResourceNode"
          >
            <template #default="{ data }">
              <div
                :class="[
                  'resource-tree-node',
                  `is-${data.kind}`,
                  { 'is-active': data.kind === 'resource' && data.id === selectedResourceId },
                ]"
              >
                <FaIcon class="resource-tree-node__icon" :name="data.icon" />
                <span class="resource-tree-node__title">{{ data.label }}</span>
                <code class="resource-tree-node__code">{{ data.code }}</code>
                <ElTag class="resource-tree-node__count" effect="plain" size="small" type="info">
                  {{
                    data.kind === 'module' ? data.children.length : data.resource.permissions.length
                  }}
                </ElTag>
              </div>
            </template>
          </ElTree>
        </aside>

        <main class="access-detail-panel">
          <ElButton class="access-mobile-back" text @click="showCatalog">
            <FaIcon name="i-ri:arrow-left-line" />返回{{ mode === 'menus' ? '菜单' : '资源' }}目录
          </ElButton>

          <template v-if="mode === 'menus' && selectedMenu">
            <header class="access-detail-header">
              <div>
                <p class="access-detail-kicker">
                  {{ selectedMenu.menuType === 'catalog' ? '目录' : '页面菜单' }}
                </p>
                <h2>{{ selectedMenu.title }}</h2>
                <code>{{ selectedMenu.name }}</code>
              </div>
              <div class="access-detail-actions">
                <ElButton
                  v-if="selectedMenu.menuType === 'catalog' && canCreateMenu"
                  plain
                  @click="openCreateMenu('menu', selectedMenu.id)"
                >
                  <FaIcon name="i-ri:file-add-line" />添加页面
                </ElButton>
                <ElButton
                  v-if="canEditMenu"
                  :disabled="isEntityBusy('menu', selectedMenu.id)"
                  plain
                  @click="openEditMenu(selectedMenu)"
                >
                  <FaIcon name="i-ri:edit-line" />编辑
                </ElButton>
                <ElButton
                  v-auth="'system.menu.update'"
                  :disabled="isEntityBusy('menu', selectedMenu.id)"
                  :loading="isPending(`menu:${selectedMenu.id}:status`)"
                  plain
                  @click="toggleMenu(selectedMenu)"
                >
                  <FaIcon
                    :name="
                      selectedMenu.status === 'active'
                        ? 'i-ri:pause-circle-line'
                        : 'i-ri:play-circle-line'
                    "
                  />
                  {{ selectedMenu.status === 'active' ? '停用' : '启用' }}
                </ElButton>
                <ElButton
                  v-auth="'system.menu.delete'"
                  :disabled="selectedMenu.isBuiltIn || isEntityBusy('menu', selectedMenu.id)"
                  :loading="isPending(`menu:${selectedMenu.id}:delete`)"
                  plain
                  type="danger"
                  @click="removeMenu(selectedMenu)"
                >
                  <FaIcon name="i-ri:delete-bin-line" />删除
                </ElButton>
              </div>
            </header>

            <ElDescriptions class="menu-metadata" :column="2" border>
              <ElDescriptionsItem label="状态">
                <ElTag :type="selectedMenu.status === 'active' ? 'success' : 'info'">
                  {{ selectedMenu.status === 'active' ? '启用' : '停用' }}
                </ElTag>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="排序">{{ selectedMenu.sort }}</ElDescriptionsItem>
              <ElDescriptionsItem label="上级目录">
                {{ menus.find(({ id }) => id === selectedMenu?.parentId)?.title || '顶级' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="路径">{{ selectedMenu.path }}</ElDescriptionsItem>
              <ElDescriptionsItem label="路由名">{{ selectedMenu.routeName }}</ElDescriptionsItem>
              <ElDescriptionsItem label="来源">{{
                selectedMenu.isBuiltIn ? '内置配置' : '自定义'
              }}</ElDescriptionsItem>
            </ElDescriptions>

            <section class="access-section">
              <div class="access-section__heading">
                <div>
                  <h3>关联资源</h3>
                  <p>用户拥有任一资源的查看权限即可看到此页面。</p>
                </div>
              </div>
              <div v-if="selectedMenu.resources.length" class="resource-links">
                <button
                  v-for="resource in selectedMenu.resources"
                  :key="resource.id"
                  type="button"
                  @click="selectLinkedResource(resource.id)"
                >
                  <span>{{ resource.name }}</span
                  ><code>{{ resource.key }}</code>
                </button>
              </div>
              <ElEmpty
                v-else
                class="menu-resource-empty"
                :image-size="72"
                description="未关联资源，登录后默认可见"
              />
            </section>
          </template>

          <template v-else-if="mode === 'resources' && selectedResource">
            <header class="access-detail-header">
              <div>
                <p class="access-detail-kicker">
                  {{ getSystemResourceModuleLabel(selectedResource.module) }}
                  <code>{{ selectedResource.module }}</code>
                </p>
                <h2>{{ selectedResource.name }}</h2>
                <code>{{ selectedResource.key }}</code>
                <p v-if="selectedResource.description" class="access-detail-summary">
                  {{ selectedResource.description }}
                </p>
              </div>
              <div class="access-detail-actions">
                <ElButton
                  v-auth="'system.permission.create'"
                  :disabled="isEntityBusy('resource', selectedResource.id)"
                  type="primary"
                  plain
                  @click="openCreatePermission(selectedResource)"
                >
                  <FaIcon name="i-ri:add-circle-line" />新增操作权限
                </ElButton>
                <ElButton
                  v-auth="'system.permission.update'"
                  :disabled="isEntityBusy('resource', selectedResource.id)"
                  plain
                  @click="openEditResource(selectedResource)"
                >
                  <FaIcon name="i-ri:edit-line" />编辑资源
                </ElButton>
                <ElButton
                  v-auth="'system.permission.update'"
                  :disabled="isEntityBusy('resource', selectedResource.id)"
                  :loading="isPending(`resource:${selectedResource.id}:status`)"
                  plain
                  @click="toggleResource(selectedResource)"
                >
                  <FaIcon
                    :name="
                      selectedResource.status === 'active'
                        ? 'i-ri:pause-circle-line'
                        : 'i-ri:play-circle-line'
                    "
                  />
                  {{ selectedResource.status === 'active' ? '停用' : '启用' }}
                </ElButton>
                <ElButton
                  v-auth="'system.permission.delete'"
                  :disabled="
                    selectedResource.isBuiltIn || isEntityBusy('resource', selectedResource.id)
                  "
                  :loading="isPending(`resource:${selectedResource.id}:delete`)"
                  plain
                  type="danger"
                  @click="removeResource(selectedResource)"
                >
                  <FaIcon name="i-ri:delete-bin-line" />删除
                </ElButton>
              </div>
            </header>

            <div class="resource-stats">
              <div class="resource-stat">
                <span>权限</span><strong>{{ selectedResource.permissions.length }}</strong>
              </div>
              <ElPopover placement="bottom" trigger="click" width="280">
                <template #reference>
                  <button class="resource-stat resource-stat--interactive" type="button">
                    <span>关联菜单</span
                    ><span class="resource-stat__value"
                      ><strong>{{ selectedResource.menuCount }}</strong
                      ><FaIcon name="i-ri:arrow-down-s-line"
                    /></span>
                  </button>
                </template>
                <div class="impact-list">
                  <strong>关联菜单</strong>
                  <ul v-if="selectedResource.menus.length">
                    <li v-for="menu in selectedResource.menus" :key="menu.id">
                      <span>{{ menu.title }}</span
                      ><code>{{ menu.routeName }}</code>
                    </li>
                  </ul>
                  <p v-else>暂无关联菜单</p>
                </div>
              </ElPopover>
              <ElPopover placement="bottom" trigger="click" width="280">
                <template #reference>
                  <button class="resource-stat resource-stat--interactive" type="button">
                    <span>授权角色</span
                    ><span class="resource-stat__value"
                      ><strong>{{ selectedResource.roleCount }}</strong
                      ><FaIcon name="i-ri:arrow-down-s-line"
                    /></span>
                  </button>
                </template>
                <div class="impact-list">
                  <strong>授权角色</strong>
                  <ul v-if="selectedResource.roles.length">
                    <li v-for="roleItem in selectedResource.roles" :key="roleItem.id">
                      <span>{{ roleItem.name }}</span
                      ><code>{{ roleItem.code }}</code>
                    </li>
                  </ul>
                  <p v-else>暂无授权角色</p>
                </div>
              </ElPopover>
              <div class="resource-stat">
                <span>状态</span
                ><ElTag
                  size="small"
                  :type="selectedResource.status === 'active' ? 'success' : 'info'"
                  >{{ selectedResource.status === 'active' ? '启用' : '停用' }}</ElTag
                >
              </div>
            </div>

            <section class="access-section">
              <div class="access-section__heading">
                <div>
                  <h3>权限动作</h3>
                  <p>操作权限自动依赖同一资源的查看权限。</p>
                </div>
              </div>
              <div class="permission-list">
                <div class="permission-list__head" aria-hidden="true">
                  <span>权限</span><span>说明</span><span>状态</span><span>授权角色</span
                  ><span>操作</span>
                </div>
                <div
                  v-for="permission in selectedResource.permissions"
                  :key="permission.id"
                  class="permission-row"
                >
                  <div class="permission-row__identity">
                    <FaIcon
                      class="permission-row__icon"
                      :name="permissionActionIcon(permission.action)"
                    />
                    <div>
                      <span>{{ permission.name }}</span
                      ><code>{{ permission.code }}</code>
                    </div>
                  </div>
                  <p>{{ permission.description || '暂无说明' }}</p>
                  <ElTag
                    effect="plain"
                    size="small"
                    :type="permission.status === 'active' ? 'success' : 'info'"
                    >{{ permission.status === 'active' ? '启用' : '停用' }}</ElTag
                  >
                  <ElPopover
                    v-if="permission.roles.length"
                    placement="top"
                    trigger="click"
                    width="260"
                  >
                    <template #reference
                      ><ElButton class="permission-impact" text
                        >{{ permission.roles.length }} 个角色</ElButton
                      ></template
                    >
                    <div class="impact-list">
                      <strong>使用该权限的角色</strong>
                      <ul>
                        <li v-for="roleItem in permission.roles" :key="roleItem.id">
                          <span>{{ roleItem.name }}</span
                          ><code>{{ roleItem.code }}</code>
                        </li>
                      </ul>
                    </div>
                  </ElPopover>
                  <span v-else class="permission-impact permission-impact--empty">未授权</span>
                  <div class="permission-row__actions">
                    <ElTooltip content="编辑权限" placement="top"
                      ><ElButton
                        v-auth="'system.permission.update'"
                        aria-label="编辑权限"
                        :disabled="isEntityBusy('permission', permission.id)"
                        text
                        circle
                        @click="openEditPermission(permission)"
                        ><FaIcon name="i-ri:edit-line" /></ElButton
                    ></ElTooltip>
                    <ElTooltip
                      v-if="permission.action !== 'view'"
                      :content="permission.status === 'active' ? '停用权限' : '启用权限'"
                      placement="top"
                      ><ElButton
                        v-auth="'system.permission.update'"
                        :aria-label="permission.status === 'active' ? '停用权限' : '启用权限'"
                        :disabled="isEntityBusy('permission', permission.id)"
                        :loading="isPending(`permission:${permission.id}:status`)"
                        text
                        circle
                        @click="togglePermission(permission)"
                        ><FaIcon
                          :name="
                            permission.status === 'active'
                              ? 'i-ri:pause-circle-line'
                              : 'i-ri:play-circle-line'
                          " /></ElButton
                    ></ElTooltip>
                    <ElTooltip
                      v-if="permission.action !== 'view'"
                      content="删除权限"
                      placement="top"
                      ><ElButton
                        v-auth="'system.permission.delete'"
                        aria-label="删除权限"
                        :disabled="
                          permission.isBuiltIn || isEntityBusy('permission', permission.id)
                        "
                        :loading="isPending(`permission:${permission.id}:delete`)"
                        text
                        circle
                        type="danger"
                        @click="removePermission(permission)"
                        ><FaIcon name="i-ri:delete-bin-line" /></ElButton
                    ></ElTooltip>
                  </div>
                </div>
              </div>
            </section>
          </template>
          <ElEmpty v-else description="请选择左侧项目查看详情" />
        </main>
      </div>
    </FaPageMain>

    <SystemMenuConfigurationDialog
      v-model="menuDialogOpen"
      :editing="editingMenu"
      :initial-parent-id="initialParentId"
      :initial-type="initialMenuType"
      :menus="menus"
      :resources="resources"
      :saving="saving"
      @submit="saveMenu"
    />
    <SystemResourceDialog
      v-model="resourceDialogOpen"
      :editing="editingResource"
      :module-options="resourceModuleOptions"
      :saving="saving"
      @submit="saveResource"
    />
    <SystemPermissionDialog
      v-model="permissionDialogOpen"
      :editing="editingPermission"
      :resource="selectedResource"
      :saving="saving"
      @submit="savePermission"
    />
  </div>
</template>
