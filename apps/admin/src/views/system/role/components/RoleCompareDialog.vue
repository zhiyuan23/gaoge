<script setup lang="ts">
import type { SystemRole, SystemRoleComparison } from '@/api/system/role'

defineOptions({
  name: 'RoleCompareDialog',
})

const props = defineProps<{
  modelValue: boolean
  currentRoleId: number | null
  roles: SystemRole[]
  result: SystemRoleComparison | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'compare', targetRoleId: number): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const targetRoleId = ref<number | null>(null)

const compareOptions = computed(() => props.roles.filter((item) => item.id !== props.currentRoleId))

watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      targetRoleId.value = compareOptions.value[0]?.id ?? null
    }
  },
  {
    immediate: true,
  },
)

function handleCompare() {
  if (!targetRoleId.value) {
    return
  }

  emit('compare', targetRoleId.value)
}
</script>

<template>
  <ElDialog v-model="visible" title="角色差异对比" width="760px" destroy-on-close>
    <div class="mb-4 flex items-center gap-3">
      <ElSelect v-model="targetRoleId" placeholder="请选择对比角色" class="w-full">
        <ElOption
          v-for="item in compareOptions"
          :key="item.id"
          :label="`${item.name}（${item.code}）`"
          :value="item.id"
        />
      </ElSelect>
      <ElButton type="primary" :loading="loading" @click="handleCompare">开始对比</ElButton>
    </div>

    <ElEmpty v-if="!result" description="选择一个角色后开始对比" :image-size="72" class="py-8" />

    <div v-else class="space-y-5">
      <ElAlert
        :title="`${result.leftRole.name} 对比 ${result.rightRole.name}`"
        type="info"
        :closable="false"
      />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ElCard shadow="never">
          <template #header>菜单差异</template>
          <div class="space-y-3 text-sm">
            <div>
              <div class="font-500 mb-2 text-emerald-600">当前角色多出的菜单</div>
              <div class="flex flex-wrap gap-2">
                <ElTag
                  v-for="item in result.menuDiff.added"
                  :key="item.key"
                  type="success"
                  effect="light"
                >
                  {{ item.label }}
                </ElTag>
                <span v-if="result.menuDiff.added.length === 0" class="text-secondary">无</span>
              </div>
            </div>
            <div>
              <div class="font-500 mb-2 text-amber-600">当前角色缺少的菜单</div>
              <div class="flex flex-wrap gap-2">
                <ElTag
                  v-for="item in result.menuDiff.removed"
                  :key="item.key"
                  type="warning"
                  effect="light"
                >
                  {{ item.label }}
                </ElTag>
                <span v-if="result.menuDiff.removed.length === 0" class="text-secondary">无</span>
              </div>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="never">
          <template #header>动作差异</template>
          <div class="space-y-3 text-sm">
            <div>
              <div class="font-500 mb-2 text-emerald-600">当前角色多出的动作</div>
              <div class="flex flex-wrap gap-2">
                <ElTag
                  v-for="item in result.permissionDiff.added"
                  :key="item.key"
                  type="success"
                  effect="light"
                >
                  {{ item.label }}
                </ElTag>
                <span v-if="result.permissionDiff.added.length === 0" class="text-secondary">
                  无
                </span>
              </div>
            </div>
            <div>
              <div class="font-500 mb-2 text-amber-600">当前角色缺少的动作</div>
              <div class="flex flex-wrap gap-2">
                <ElTag
                  v-for="item in result.permissionDiff.removed"
                  :key="item.key"
                  type="warning"
                  effect="light"
                >
                  {{ item.label }}
                </ElTag>
                <span v-if="result.permissionDiff.removed.length === 0" class="text-secondary">
                  无
                </span>
              </div>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="never">
          <template #header>关联用户差异</template>
          <div class="space-y-3 text-sm">
            <div>
              <div class="font-500 mb-2 text-emerald-600">当前角色独有用户</div>
              <div class="flex flex-wrap gap-2">
                <ElTag
                  v-for="item in result.userDiff.added"
                  :key="item.key"
                  type="success"
                  effect="light"
                >
                  {{ item.label }}
                </ElTag>
                <span v-if="result.userDiff.added.length === 0" class="text-secondary">无</span>
              </div>
            </div>
            <div>
              <div class="font-500 mb-2 text-amber-600">对比角色独有用户</div>
              <div class="flex flex-wrap gap-2">
                <ElTag
                  v-for="item in result.userDiff.removed"
                  :key="item.key"
                  type="warning"
                  effect="light"
                >
                  {{ item.label }}
                </ElTag>
                <span v-if="result.userDiff.removed.length === 0" class="text-secondary">无</span>
              </div>
            </div>
          </div>
        </ElCard>
      </div>
    </div>
  </ElDialog>
</template>
