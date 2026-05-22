<script setup lang="ts">
import type { SystemRoleRelatedUser } from '@/api/system/role'
import { formatDateTime } from '@/views/system/user/schemas/table'

defineOptions({
  name: 'RoleRelatedUserPanel',
})

const props = defineProps<{
  users: SystemRoleRelatedUser[]
  userCount: number
}>()

defineEmits<{
  (e: 'manage-users'): void
}>()

const previewUsers = computed(() => props.users.slice(0, 3))
</script>

<template>
  <ElCard shadow="never" class="role-workspace-card">
    <div class="role-related-summary">
      <div class="role-related-summary__stat">
        <div class="role-panel-muted text-xs">关联用户</div>
        <div class="font-700 mt-2 text-2xl">{{ userCount }}</div>
      </div>

      <div class="role-related-summary__content">
        <div>
          <div class="font-600 text-base">影响面摘要</div>
          <div class="role-panel-muted mt-1 text-xs">
            当前角色绑定用户摘要。批量追加、替换和权限来源解释统一在用户管理页完成。
          </div>
        </div>

        <div v-if="previewUsers.length > 0" class="role-related-user-list">
          <div v-for="user in previewUsers" :key="user.id" class="role-related-user-item">
            <div class="min-w-0">
              <div class="font-500 truncate text-sm">
                {{ user.nickname || user.account }}
              </div>
              <div class="role-panel-muted truncate text-xs">{{ user.account }}</div>
            </div>
            <div class="role-related-user-item__meta">
              <ElTag size="small" :type="user.status === 'active' ? 'success' : 'info'">
                {{ user.status === 'active' ? '启用' : '停用' }}
              </ElTag>
              <span class="role-panel-muted text-xs">{{
                formatDateTime(user.lastLoginAt) || '未登录'
              }}</span>
            </div>
          </div>
        </div>
        <ElEmpty v-else description="当前角色暂无绑定用户" :image-size="60" />
      </div>

      <div class="role-related-summary__aside">
        <ElButton plain @click="$emit('manage-users')">前往用户管理</ElButton>
      </div>
    </div>
  </ElCard>
</template>

<style scoped lang="scss">
.role-panel-muted {
  color: var(--el-text-color-regular);
}

.role-related-summary {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}

.role-related-summary__stat,
.role-related-summary__content {
  min-width: 0;
}

.role-related-summary__stat {
  padding: 16px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
}

.role-related-summary__content {
  display: grid;
  gap: 12px;
}

.role-related-summary__aside {
  display: flex;
  justify-content: flex-end;
}

.role-related-user-list {
  display: grid;
  gap: 10px;
}

.role-related-user-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
}

.role-related-user-item__meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}

:deep(.el-card__body) {
  min-height: 0;
}

@media (width <= 900px) {
  .role-related-summary {
    grid-template-columns: 1fr;
  }

  .role-related-summary__aside,
  .role-related-user-item__meta {
    justify-content: flex-start;
    justify-items: start;
  }

  .role-related-user-item {
    grid-template-columns: 1fr;
  }
}
</style>
