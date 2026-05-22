<script setup lang="ts">
import type { ElTree } from 'element-plus'

import type { SystemRoleMenuNode, SystemRolePermissionModule } from '@/api/system/role'

defineOptions({
  name: 'RoleMenuPanel',
})

const props = defineProps<{
  menuTree: SystemRoleMenuNode[]
  menuPermissionGroups: Record<number, SystemRolePermissionModule[]>
  selectedMenuIds: number[]
  selectedMenuPermissionIdsByMenu: Record<number, number[]>
}>()

const emit = defineEmits<{
  (e: 'update:menuIds', value: number[]): void
  (e: 'update:menuPermissionIdsByMenu', value: Record<number, number[]>): void
}>()

const treeRef = ref<InstanceType<typeof ElTree>>()

const menuMap = computed(() => {
  const map = new Map<number, SystemRoleMenuNode>()

  const visit = (node: SystemRoleMenuNode) => {
    map.set(node.id, node)
    node.children.forEach(visit)
  }

  props.menuTree.forEach(visit)

  return map
})

const checkedMenuIdSet = computed(() => new Set(props.selectedMenuIds))
const checkedMenuCount = computed(() => props.selectedMenuIds.length)
const selectedActionCount = computed(() =>
  Object.values(props.selectedMenuPermissionIdsByMenu).reduce((sum, ids) => sum + ids.length, 0),
)

function syncTreeState() {
  nextTick(() => {
    treeRef.value?.setCheckedKeys(props.selectedMenuIds)
  })
}

function handleCheck() {
  const nextKeys = (treeRef.value?.getCheckedKeys(false) ?? []) as number[]

  emit(
    'update:menuIds',
    nextKeys.filter((id) => {
      const node = menuMap.value.get(Number(id))
      return node?.menuType === 'menu' && (node.permissionIds.length ?? 0) > 0
    }),
  )
}

function isMenuChecked(menuId: number) {
  return checkedMenuIdSet.value.has(menuId)
}

function getMenuPermissionGroups(menuId: number) {
  return props.menuPermissionGroups[menuId] ?? []
}

function getActionIds(menuId: number) {
  return props.selectedMenuPermissionIdsByMenu[menuId] ?? []
}

function getSelectedActionCount(menuId: number) {
  return getActionIds(menuId).length
}

function getTotalActionCount(menuId: number) {
  return getMenuPermissionGroups(menuId).reduce(
    (sum, moduleGroup) =>
      sum +
      moduleGroup.resources.reduce((resourceSum, resourceGroup) => {
        return resourceSum + resourceGroup.permissions.length
      }, 0),
    0,
  )
}

function handlePermissionChange(menuId: number, value: Array<string | number | boolean>) {
  emit('update:menuPermissionIdsByMenu', {
    ...props.selectedMenuPermissionIdsByMenu,
    [menuId]: value.filter((item): item is number => typeof item === 'number'),
  })
}

watch(
  () => [props.menuTree, props.selectedMenuIds],
  () => {
    syncTreeState()
  },
  {
    immediate: true,
    deep: true,
  },
)
</script>

<template>
  <ElCard shadow="never" class="role-workspace-card">
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="font-600 text-base">访问与动作</div>
          <div class="role-panel-muted mt-1 text-xs">
            在同一棵树里完成授权。目录只做层级组织，菜单勾选后直接在节点下配置菜单内动作。
          </div>
        </div>
        <div class="role-panel-summary">
          <span class="role-panel-muted text-sm">菜单 {{ checkedMenuCount }} 项</span>
          <span class="role-panel-muted text-sm">动作 {{ selectedActionCount }} 项</span>
        </div>
      </div>
    </template>

    <div class="role-panel-tree">
      <ElTree
        ref="treeRef"
        :data="menuTree"
        node-key="id"
        show-checkbox
        default-expand-all
        :props="{ label: 'title', children: 'children' }"
        @check="handleCheck"
      >
        <template #default="{ data }">
          <div class="role-tree-node">
            <div class="role-tree-node__main">
              <div class="role-tree-node__header">
                <div class="role-tree-node__content">
                  <div class="font-500 text-sm leading-5">{{ data.title }}</div>
                  <div class="role-tree-node__meta">
                    <span v-if="data.routeName" class="role-tree-node__route">{{
                      data.routeName
                    }}</span>
                    <span class="role-tree-node__path">{{ data.path || '-' }}</span>
                  </div>
                </div>
                <div class="role-tree-node__suffix">
                  <ElTag
                    size="small"
                    class="role-tree-node__tag"
                    :type="data.menuType === 'catalog' ? 'warning' : 'primary'"
                  >
                    {{ data.menuType === 'catalog' ? '目录' : '菜单' }}
                  </ElTag>
                  <span
                    v-if="data.menuType === 'menu' && getTotalActionCount(data.id) > 0"
                    class="role-tree-node__count"
                  >
                    动作 {{ getSelectedActionCount(data.id) }}/{{ getTotalActionCount(data.id) }}
                  </span>
                </div>
              </div>

              <div
                v-if="data.menuType === 'menu' && isMenuChecked(data.id)"
                class="role-tree-node__actions"
                @click.stop
              >
                <div
                  v-if="getMenuPermissionGroups(data.id).length === 0"
                  class="role-tree-node__empty"
                >
                  当前菜单暂无挂载动作权限
                </div>
                <div v-else class="role-tree-action-list">
                  <div
                    v-for="moduleGroup in getMenuPermissionGroups(data.id)"
                    :key="moduleGroup.module"
                    class="role-tree-action-module"
                  >
                    <div class="role-tree-action-module__title">
                      {{ moduleGroup.label }}
                    </div>
                    <div
                      v-for="resourceGroup in moduleGroup.resources"
                      :key="`${moduleGroup.module}-${resourceGroup.resource}`"
                      class="role-tree-action-resource"
                    >
                      <div class="role-tree-action-resource__header">
                        <span class="font-500 text-xs">{{ resourceGroup.label }}</span>
                        <span class="role-panel-muted text-xs">
                          已选
                          {{
                            getActionIds(data.id).filter((id) =>
                              resourceGroup.permissions.some((permission) => permission.id === id),
                            ).length
                          }}/{{ resourceGroup.permissions.length }}
                        </span>
                      </div>
                      <ElCheckboxGroup
                        :model-value="getActionIds(data.id)"
                        @update:model-value="handlePermissionChange(data.id, $event)"
                      >
                        <div class="role-tree-action-resource__options">
                          <ElCheckbox
                            v-for="permission in resourceGroup.permissions"
                            :key="permission.id"
                            :value="permission.id"
                          >
                            <div class="flex flex-col">
                              <span>{{ permission.name }}</span>
                              <span class="role-panel-muted text-xs">{{ permission.code }}</span>
                            </div>
                          </ElCheckbox>
                        </div>
                      </ElCheckboxGroup>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ElTree>
    </div>
  </ElCard>
</template>

<style scoped lang="scss">
.role-panel-muted {
  color: var(--el-text-color-regular);
}

.role-panel-summary {
  display: flex;
  gap: 12px;
}

.role-panel-tree {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  overflow: auto;
}

.role-tree-node {
  width: 100%;
  min-width: 0;
  padding: 8px 0;
}

.role-tree-node__main {
  display: grid;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.role-tree-node__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 12px;
  align-items: start;
}

.role-tree-node__content {
  min-width: 0;
}

.role-tree-node__meta {
  display: grid;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.role-tree-node__route {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-tree-node__path {
  overflow-wrap: anywhere;
}

.role-tree-node__suffix {
  display: grid;
  gap: 6px;
  justify-items: end;
  padding-top: 2px;
}

.role-tree-node__count {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.role-tree-node__actions {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  margin-right: 8px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
}

.role-tree-node__empty {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.role-tree-action-list,
.role-tree-action-module {
  display: grid;
  gap: 10px;
}

.role-tree-action-module__title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.role-tree-action-resource {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.role-tree-action-resource__header {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.role-tree-action-resource__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

:deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.el-tree) {
  --el-tree-node-content-height: auto;

  background: transparent;
}

:deep(.el-tree-node__content) {
  align-items: start;
  height: auto;
  padding-block: 4px;
}

:deep(.el-checkbox) {
  align-items: start;
  width: 100%;
  min-width: 0;
  margin-right: 0;
}

:deep(.el-checkbox__label) {
  min-width: 0;
  padding-top: 1px;
  white-space: normal;
}

@media (width <= 768px) {
  .role-panel-summary {
    display: grid;
    gap: 6px;
  }

  .role-tree-node__header,
  .role-tree-action-resource__header {
    grid-template-columns: 1fr;
  }

  .role-tree-node__suffix {
    justify-items: start;
  }

  .role-tree-action-resource__options {
    grid-template-columns: 1fr;
  }
}
</style>
