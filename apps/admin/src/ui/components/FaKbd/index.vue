<script setup lang="ts">
defineOptions({
  name: 'FaKbd',
})
</script>

<template>
  <kbd
    class="bg-muted text-muted-foreground inline-flex h-6 select-none items-center gap-1 rounded-md border px-1.5 font-sans text-sm font-medium"
  >
    <slot />
  </kbd>
</template>
