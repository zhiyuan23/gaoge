<script setup lang="ts">
defineOptions({ name: 'SystemIdentityCell' })

defineProps<{
  badge?: string
  code?: string | null
  icon?: string | null
  primary: string
}>()
</script>

<template>
  <div class="flex min-w-0 items-center gap-2 whitespace-nowrap">
    <FaIcon v-if="icon" :name="icon" class="size-4 shrink-0" />
    <strong
      class="min-w-0 truncate font-medium"
      :class="code && code !== primary ? 'max-w-[55%] shrink-0' : 'flex-1'"
      :title="primary"
    >
      {{ primary }}
    </strong>
    <template v-if="code && code !== primary">
      <span class="text-muted-foreground shrink-0" aria-hidden="true">·</span>
      <code class="text-muted-foreground min-w-0 flex-1 truncate text-xs" :title="code">
        {{ code }}
      </code>
    </template>
    <ElTag v-if="badge" class="shrink-0" effect="plain" size="small">
      {{ badge }}
    </ElTag>
  </div>
</template>
