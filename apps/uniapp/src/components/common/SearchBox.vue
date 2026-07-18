<script setup lang="ts">
// 完全标准的 Props 写法
interface Props {
  placeholder?: string
}

withDefaults(defineProps<Props>(), {
  placeholder: '请输入搜索内容',
})

// 完全标准的 Emits 写法
const emit = defineEmits<{
  search: [value: string]
}>()

// 搜索双向绑定
const searchValue = ref('')

// 搜索提交
const handleSubmit = () => {
  emit('search', searchValue.value)
}

// 历史记录
const resetAction = () => {
  searchValue.value = ''
}
</script>

<template>
  <view class="z-999 relative bg-white">
    <view class="px-30 flex items-center justify-between py-20">
      <view class="mr-20 flex-1">
        <t-search
          v-model="searchValue"
          :placeholder="placeholder"
          class="w-full"
          borderless
          @submit="handleSubmit"
        />
      </view>

      <view>
        <t-button variant="text" class="text-primary flex-shrink-0" @click="handleSubmit">
          查询
        </t-button>
        <t-button variant="text" class="text-primary flex-shrink-0" @click="resetAction">
          重置
        </t-button>
      </view>
    </view>
  </view>
</template>
