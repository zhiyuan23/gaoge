<script setup lang="ts">
import type { SystemUserPermissionExplanation } from '@/api/system/user'

defineOptions({
  name: 'PermissionExplanationDrawer',
})

const props = defineProps<{
  modelValue: boolean
  explanation: SystemUserPermissionExplanation | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <ElDrawer v-model="visible" title="权限来源解释" size="760px">
    <div v-loading="loading" class="space-y-5">
      <ElEmpty
        v-if="!explanation"
        description="请选择一个用户查看权限来源"
        :image-size="72"
        class="py-12"
      />

      <template v-else>
        <ElCard shadow="never">
          <div class="flex flex-wrap items-center gap-3">
            <div class="font-700 text-lg">{{ explanation.user.account }}</div>
            <ElTag :type="explanation.user.status === 'active' ? 'success' : 'info'">
              {{ explanation.user.status === 'active' ? '启用' : '停用' }}
            </ElTag>
          </div>
          <div class="text-secondary mt-2 text-sm">
            {{ explanation.user.nickname || '未填写昵称' }} · 当前挂载
            {{ explanation.roles.length }} 个角色
          </div>
        </ElCard>

        <ElCard shadow="never">
          <template #header>角色贡献</template>
          <div class="space-y-4">
            <div
              v-for="role in explanation.roles"
              :key="role.id"
              class="rounded-xl border border-stone-200 p-4"
            >
              <div class="flex items-center gap-3">
                <div class="font-600">{{ role.name }}</div>
                <ElTag size="small">{{ role.code }}</ElTag>
              </div>
              <div class="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div>
                  <div class="font-500 mb-2 text-sm">带来的菜单</div>
                  <div class="flex flex-wrap gap-2">
                    <ElTag v-for="menu in role.menus" :key="menu.id" size="small" type="success">
                      {{ menu.title }}
                    </ElTag>
                    <span v-if="role.menus.length === 0" class="text-secondary text-sm">无</span>
                  </div>
                </div>
                <div>
                  <div class="font-500 mb-2 text-sm">带来的权限</div>
                  <div class="flex flex-wrap gap-2">
                    <ElTag
                      v-for="permission in role.permissions"
                      :key="permission.id"
                      size="small"
                      type="info"
                    >
                      {{ permission.code }}
                    </ElTag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="never">
          <template #header>汇总菜单来源</template>
          <ElTable :data="explanation.menus" border stripe>
            <ElTableColumn prop="title" label="菜单" min-width="160" />
            <ElTableColumn prop="path" label="路径" min-width="180" />
            <ElTableColumn label="来源角色" min-width="220">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-2">
                  <ElTag v-for="item in row.viaRoles" :key="item" size="small" type="info">
                    {{ item }}
                  </ElTag>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>

        <ElCard shadow="never">
          <template #header>汇总权限来源</template>
          <ElTable :data="explanation.permissions" border stripe>
            <ElTableColumn prop="code" label="权限码" min-width="220" />
            <ElTableColumn prop="name" label="权限名称" min-width="140" />
            <ElTableColumn label="来源角色" min-width="220">
              <template #default="{ row }">
                <div class="flex flex-wrap gap-2">
                  <ElTag v-for="item in row.viaRoles" :key="item" size="small" type="info">
                    {{ item }}
                  </ElTag>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </template>
    </div>
  </ElDrawer>
</template>
