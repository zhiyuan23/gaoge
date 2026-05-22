<route lang="yaml">
meta:
  title: 角色中心
</route>

<script setup lang="ts">
import { ElMessage, ElMessageBox, ElTag } from 'element-plus'

import type { SystemRole, SystemRoleComparison } from '@/api/system/role'
import systemRoleApi from '@/api/system/role'
import type { SearchFormData } from '@/components/common/EsSearch/types'

import RoleCompareDialog from './components/RoleCompareDialog.vue'
import RoleFormDialog from './components/RoleFormDialog.vue'
import RoleMenuPanel from './components/RoleMenuPanel.vue'
import RoleRelatedUserPanel from './components/RoleRelatedUserPanel.vue'
import { SYSTEM_ROLE_DEFAULT_SEARCH } from './model/defaults'
import { buildSystemRoleCreatePayload, buildSystemRoleUpdatePayload } from './model/mapper'
import type { SystemRoleFormModel, SystemRoleSearch } from './model/types'
import { createSystemRoleSearchFields } from './schemas/search'
import { SYSTEM_ROLE_PERMISSIONS } from './auth'
import {
  collectCheckedMenuIds,
  collectCheckedPermissionIdsByMenu,
  createCopiedRoleForm,
} from './constants'

defineOptions({
  name: 'SystemRole',
})

const router = useRouter()

const allRoles = ref<SystemRole[]>([])
const loading = ref(false)
const workspaceLoading = ref(false)
const submitLoading = ref(false)
const workspaceSaving = ref(false)
const compareLoading = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogRole = ref<SystemRole | null>(null)
const dialogInitialValue = ref<Partial<SystemRoleFormModel> | null>(null)
const compareVisible = ref(false)
const compareResult = ref<SystemRoleComparison | null>(null)
const selectedRoleId = ref<number | null>(null)
const workspaceDetail = ref<Awaited<ReturnType<typeof systemRoleApi.detail>> | null>(null)
const selectedMenuIds = ref<number[]>([])
const selectedMenuPermissionIdsByMenu = ref<Record<number, number[]>>({})

const search = ref<SystemRoleSearch>({ ...SYSTEM_ROLE_DEFAULT_SEARCH })

const roleList = computed(() => {
  let list = allRoles.value
  const keyword = search.value.keyword.trim().toLowerCase()
  const status = search.value.status

  if (keyword) {
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword),
    )
  }
  if (status) {
    list = list.filter((item) => item.status === status)
  }

  return list
})

const selectedRole = computed(
  () => allRoles.value.find((item) => item.id === selectedRoleId.value) ?? null,
)

function hydrateWorkspace(detail: Awaited<ReturnType<typeof systemRoleApi.detail>>) {
  workspaceDetail.value = detail
  selectedMenuIds.value = collectCheckedMenuIds(detail.menuTree)
  selectedMenuPermissionIdsByMenu.value = collectCheckedPermissionIdsByMenu(
    detail.menuPermissionGroups,
  )
}

async function fetchList() {
  loading.value = true
  try {
    allRoles.value = await systemRoleApi.list()
  } finally {
    loading.value = false
  }

  if (allRoles.value.length === 0) {
    selectedRoleId.value = null
    workspaceDetail.value = null
    return
  }

  if (!selectedRoleId.value || !allRoles.value.some((item) => item.id === selectedRoleId.value)) {
    selectedRoleId.value = allRoles.value[0]?.id ?? null
  }

  if (selectedRoleId.value) {
    await fetchRoleDetail(selectedRoleId.value)
  }
}

async function fetchRoleDetail(roleId: number) {
  selectedRoleId.value = roleId
  workspaceLoading.value = true
  try {
    hydrateWorkspace(await systemRoleApi.detail(roleId))
  } finally {
    workspaceLoading.value = false
  }
}

function handleSearch(formData: SearchFormData) {
  search.value = {
    keyword: String(formData.keyword ?? ''),
    status: String(formData.status ?? '') as SystemRoleSearch['status'],
  }

  if (selectedRoleId.value && !roleList.value.some((item) => item.id === selectedRoleId.value)) {
    selectedRoleId.value = roleList.value[0]?.id ?? null
  }
}

function openCreate(initialValue?: Partial<SystemRoleFormModel>) {
  dialogMode.value = 'create'
  dialogRole.value = null
  dialogInitialValue.value = initialValue ?? null
  dialogVisible.value = true
}

function openEdit(role: SystemRole) {
  dialogMode.value = 'edit'
  dialogRole.value = role
  dialogInitialValue.value = null
  dialogVisible.value = true
}

async function handleSubmit(payload: SystemRoleFormModel) {
  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      const created = await systemRoleApi.create(buildSystemRoleCreatePayload(payload))
      ElMessage.success('角色已创建')
      dialogVisible.value = false
      selectedRoleId.value = created.id
    } else if (dialogRole.value) {
      await systemRoleApi.update(dialogRole.value.id, buildSystemRoleUpdatePayload(payload))
      ElMessage.success('角色已更新')
      dialogVisible.value = false
    }

    await fetchList()
  } finally {
    submitLoading.value = false
  }
}

async function handleToggleStatus(role: SystemRole, status: SystemRole['status']) {
  await systemRoleApi.updateStatus(role.id, { status })
  ElMessage.success(status === 'active' ? '角色已启用' : '角色已停用')
  await fetchList()
}

async function handleDelete(role: SystemRole) {
  await ElMessageBox.confirm(`确定删除角色 ${role.name} 吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })
  await systemRoleApi.remove(role.id)
  ElMessage.success('角色已删除')
  await fetchList()
}

function handleMenuIdsChange(nextMenuIds: number[]) {
  const nextMenuIdSet = new Set(nextMenuIds)

  selectedMenuPermissionIdsByMenu.value = Object.fromEntries(
    Object.entries(selectedMenuPermissionIdsByMenu.value).map(([menuId, ids]) => [
      Number(menuId),
      nextMenuIdSet.has(Number(menuId)) ? ids : [],
    ]),
  ) as Record<number, number[]>
  selectedMenuIds.value = nextMenuIds
}

async function handleWorkspaceSave() {
  if (!selectedRoleId.value) {
    return
  }

  workspaceSaving.value = true
  try {
    hydrateWorkspace(
      await systemRoleApi.saveWorkspace(selectedRoleId.value, {
        menuIds: selectedMenuIds.value,
        menuPermissionIdsByMenu: selectedMenuPermissionIdsByMenu.value,
      }),
    )
    ElMessage.success('访问与动作已更新')
    await fetchList()
  } finally {
    workspaceSaving.value = false
  }
}

function openCompareDialog() {
  compareResult.value = null
  compareVisible.value = true
}

async function handleCompare(targetRoleId: number) {
  if (!selectedRoleId.value) {
    return
  }

  compareLoading.value = true
  try {
    compareResult.value = await systemRoleApi.compare(selectedRoleId.value, targetRoleId)
  } finally {
    compareLoading.value = false
  }
}

function handleCopyRole(role: SystemRole) {
  openCreate(createCopiedRoleForm(role))
}

function jumpToUserPage() {
  router.push('/system/user')
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="absolute-container">
    <FaPageMain class="flex-1 overflow-auto" main-class="flex-1 flex flex-col overflow-hidden">
      <div class="permission-center">
        <aside class="permission-center__sidebar">
          <div class="permission-center__sidebar-panel">
            <div class="mb-4">
              <div class="font-700 text-xl">角色中心</div>
              <div class="role-muted mt-1 text-sm">
                角色是后台唯一授权模板。围绕菜单入口与菜单内动作统一维护当前角色能力。
              </div>
            </div>

            <EsSearch
              v-model="search"
              :fields="createSystemRoleSearchFields()"
              :default-visible-count="2"
              @search="handleSearch"
            />

            <div class="mb-4 mt-4 flex items-center justify-between">
              <div class="role-muted text-sm">共 {{ roleList.length }} 个角色</div>
              <ElButton
                v-auth="SYSTEM_ROLE_PERMISSIONS.create"
                type="primary"
                plain
                @click="openCreate()"
              >
                新增角色
              </ElButton>
            </div>

            <div v-loading="loading" class="role-card-list">
              <ElEmpty
                v-if="roleList.length === 0"
                description="暂无角色数据"
                :image-size="72"
                class="py-8"
              />
              <button
                v-for="role in roleList"
                :key="role.id"
                class="role-card"
                :class="{ 'role-card--active': role.id === selectedRoleId }"
                @click="fetchRoleDetail(role.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 text-left">
                    <div class="font-600 truncate text-base">{{ role.name }}</div>
                    <div class="role-muted mt-1 truncate text-xs">{{ role.code }}</div>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <ElTag size="small" :type="role.status === 'active' ? 'success' : 'info'">
                      {{ role.status === 'active' ? '启用' : '停用' }}
                    </ElTag>
                    <ElTag v-if="role.isBuiltIn" size="small" type="warning">内置</ElTag>
                  </div>
                </div>

                <div class="role-muted mt-3 line-clamp-2 min-h-10 text-left text-xs">
                  {{ role.description || '未填写角色说明' }}
                </div>

                <div class="mt-4 grid grid-cols-3 gap-3 text-left">
                  <div class="role-summary-card px-3 py-2">
                    <div class="role-muted text-xs">用户数</div>
                    <div class="font-600 mt-1 text-sm">{{ role.userCount }}</div>
                  </div>
                  <div class="role-summary-card px-3 py-2">
                    <div class="role-muted text-xs">权限数</div>
                    <div class="font-600 mt-1 text-sm">{{ role.permissionCount }}</div>
                  </div>
                  <div class="role-summary-card px-3 py-2">
                    <div class="role-muted text-xs">排序</div>
                    <div class="font-600 mt-1 text-sm">{{ role.sort }}</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </aside>

        <section v-loading="workspaceLoading" class="permission-center__workspace">
          <ElEmpty
            v-if="!workspaceDetail || !selectedRole"
            description="请选择左侧角色开始配置权限"
            :image-size="96"
            class="h-full"
          />

          <template v-else>
            <div class="permission-center__workspace-body">
              <ElCard shadow="never" class="role-workspace-card role-workspace-card--hero">
                <template #header>
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-3">
                        <div class="font-700 text-xl">{{ selectedRole.name }}</div>
                        <ElTag :type="selectedRole.status === 'active' ? 'success' : 'info'">
                          {{ selectedRole.status === 'active' ? '启用' : '停用' }}
                        </ElTag>
                        <ElTag v-if="selectedRole.isBuiltIn" type="warning">内置角色</ElTag>
                      </div>
                      <div class="role-muted mt-2 text-sm">
                        {{ selectedRole.code }} · {{ selectedRole.description || '未填写角色说明' }}
                      </div>
                    </div>

                    <div class="flex flex-wrap justify-end gap-2">
                      <ElButton
                        v-auth="SYSTEM_ROLE_PERMISSIONS.update"
                        plain
                        @click="openEdit(selectedRole)"
                      >
                        编辑基本信息
                      </ElButton>
                      <ElButton
                        v-auth="SYSTEM_ROLE_PERMISSIONS.create"
                        plain
                        @click="handleCopyRole(selectedRole)"
                      >
                        复制角色
                      </ElButton>
                      <ElButton plain @click="openCompareDialog">差异对比</ElButton>
                      <ElButton
                        type="primary"
                        :loading="workspaceSaving"
                        @click="handleWorkspaceSave"
                      >
                        保存访问与动作
                      </ElButton>
                      <ElButton
                        v-if="selectedRole.status === 'inactive'"
                        v-auth="SYSTEM_ROLE_PERMISSIONS.enable"
                        type="success"
                        plain
                        @click="handleToggleStatus(selectedRole, 'active')"
                      >
                        启用
                      </ElButton>
                      <ElButton
                        v-else
                        v-auth="SYSTEM_ROLE_PERMISSIONS.disable"
                        type="warning"
                        plain
                        @click="handleToggleStatus(selectedRole, 'inactive')"
                      >
                        停用
                      </ElButton>
                      <ElButton
                        v-if="!selectedRole.isBuiltIn"
                        v-auth="SYSTEM_ROLE_PERMISSIONS.delete"
                        type="danger"
                        plain
                        @click="handleDelete(selectedRole)"
                      >
                        删除
                      </ElButton>
                    </div>
                  </div>
                </template>

                <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <div class="role-summary-card p-4">
                    <div class="role-muted text-xs">绑定用户</div>
                    <div class="font-700 mt-2 text-2xl">{{ selectedRole.userCount }}</div>
                  </div>
                  <div class="role-summary-card p-4">
                    <div class="role-muted text-xs">权限项</div>
                    <div class="font-700 mt-2 text-2xl">{{ selectedRole.permissionCount }}</div>
                  </div>
                  <div class="role-summary-card p-4">
                    <div class="role-muted text-xs">排序</div>
                    <div class="font-700 mt-2 text-2xl">{{ selectedRole.sort }}</div>
                  </div>
                  <div class="role-summary-card p-4">
                    <div class="role-muted text-xs">角色编码</div>
                    <div class="font-700 mt-2 text-sm">{{ selectedRole.code }}</div>
                  </div>
                </div>
              </ElCard>

              <div class="role-workspace-shell">
                <div class="role-workspace-stack">
                  <RoleMenuPanel
                    class="role-panel--menu"
                    :menu-tree="workspaceDetail.menuTree"
                    :menu-permission-groups="workspaceDetail.menuPermissionGroups"
                    :selected-menu-ids="selectedMenuIds"
                    :selected-menu-permission-ids-by-menu="selectedMenuPermissionIdsByMenu"
                    @update:menu-ids="handleMenuIdsChange"
                    @update:menu-permission-ids-by-menu="selectedMenuPermissionIdsByMenu = $event"
                  />

                  <RoleRelatedUserPanel
                    class="role-panel--related"
                    :users="workspaceDetail.relatedUsers"
                    :user-count="selectedRole.userCount"
                    @manage-users="jumpToUserPage"
                  />
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>
    </FaPageMain>

    <RoleFormDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :role="dialogRole"
      :initial-value="dialogInitialValue"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <RoleCompareDialog
      v-model="compareVisible"
      :current-role-id="selectedRoleId"
      :roles="allRoles"
      :result="compareResult"
      :loading="compareLoading"
      @compare="handleCompare"
    />
  </div>
</template>

<style scoped lang="scss">
.permission-center {
  --role-surface: var(--el-bg-color-overlay);
  --role-surface-muted: var(--el-fill-color-extra-light);
  --role-border: var(--el-border-color-light);
  --role-border-strong: var(--el-border-color);
  --role-text-muted: var(--el-text-color-regular);
  --role-shadow: 0 16px 40px rgb(15 118 110 / 10%);

  display: grid;
  flex: 1;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
  min-height: 0;

  .dark & {
    --role-shadow: 0 18px 42px rgb(15 118 110 / 18%);
  }
}

.permission-center__sidebar,
.permission-center__workspace {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.permission-center__sidebar-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.permission-center__workspace-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.role-card-list,
.permission-center__workspace {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.role-card-list,
.permission-center__workspace {
  overflow: auto;
}

.role-muted {
  color: var(--role-text-muted);
}

.role-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 16px;
  color: inherit;
  text-align: inherit;
  appearance: none;
  cursor: pointer;
  background: var(--role-surface);
  border: 1px solid var(--role-border);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.role-card:hover,
.role-card--active {
  border-color: #0f766e;
  box-shadow: var(--role-shadow);
  transform: translateY(-1px);
}

.role-card:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

.role-summary-card {
  background: var(--role-surface-muted);
  border: 1px solid var(--role-border);
  border-radius: 16px;
}

.role-workspace-card {
  display: flex;
  flex-direction: column;
  background: var(--role-surface);
  border-color: var(--role-border-strong);
  border-radius: 18px;
}

.role-workspace-card :deep(.el-card__header) {
  flex-shrink: 0;
}

.role-workspace-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
}

.role-workspace-card--hero {
  flex-shrink: 0;
}

.role-workspace-shell {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.role-workspace-stack {
  display: grid;
  flex: 1;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 12px;
  min-height: 0;
}

.role-panel--menu {
  min-height: 0;
}

.role-panel--menu :deep(.el-card__body),
.role-panel--related :deep(.el-card__body) {
  min-height: 0;
}

@media (width <= 1200px) {
  .permission-center {
    grid-template-columns: 1fr;
  }

  .role-workspace-stack {
    grid-template-rows: auto auto;
  }
}
</style>
