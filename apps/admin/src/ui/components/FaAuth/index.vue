<script setup lang="ts">
defineOptions({
  name: 'FaAuth',
})

const { value, all = false } = defineProps<{
  value: string | string[]
  all?: boolean
}>()

const isCheck = computed(() => {
  return all
    ? useAuth().authAll(typeof value === 'string' ? [value] : value)
    : useAuth().auth(value)
})
</script>

<template>
  <div class="contents">
    <slot v-if="isCheck" />
    <slot v-else name="no-auth" />
  </div>
</template>
