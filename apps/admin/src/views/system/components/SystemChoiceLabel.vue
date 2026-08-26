<script setup lang="ts">
defineOptions({ name: 'SystemChoiceLabel' })

defineProps<{
  code: string
  name: string
}>()
</script>

<template>
  <span class="system-choice whitespace-nowrap">
    <span class="system-choice__name" :title="name">{{ name }}</span>
    <span class="text-muted-foreground shrink-0" aria-hidden="true">·</span>
    <code class="system-choice__code text-muted-foreground" :title="code">{{ code }}</code>
  </span>
</template>
