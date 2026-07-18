<script setup lang="ts">
const url = ref<string>('')

const setTitle = (title = '') => {
  uni.setNavigationBarTitle({ title })
}

onLoad((options: any) => {
  if (options.url) {
    url.value = decodeURIComponent(options.url)
  }

  setTitle(options.title)
})
</script>

<template>
  <web-view class="h-full" :src="url" />
</template>
