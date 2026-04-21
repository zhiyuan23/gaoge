<route lang="yaml">
meta:
  enabled: false
</route>

<script setup lang="ts">
const scrollbar = ref(true)
const mask = ref(false)
</script>

<template>
  <div>
    <FaPageHeader title="滚动区域" description="FaScrollArea" />
    <FaPageMain>
      <div class="flex-col-start gap-4">
        <div class="flex-col-start gap-4">
          <div class="flex-center-start gap-4">
            <div class="text-sm">显示滚动条</div>
            <FaSwitch v-model="scrollbar" />
          </div>
          <div class="flex-center-start gap-4">
            <div class="text-sm">显示遮罩</div>
            <FaSwitch v-model="mask" />
          </div>
        </div>
        <FaScrollArea :scrollbar :mask class="h-72 w-48 rounded-md border">
          <div v-for="tag in 20" :key="tag" class="p-4 text-sm">
            {{ tag }}
          </div>
        </FaScrollArea>
        <FaScrollArea horizontal :scrollbar :mask class="w-96 rounded-md border">
          <div class="flex-center-start">
            <div v-for="tag in 20" :key="tag" class="flex-center h-16 w-16 text-sm">
              {{ tag }}
            </div>
          </div>
        </FaScrollArea>
      </div>
    </FaPageMain>
  </div>
</template>
