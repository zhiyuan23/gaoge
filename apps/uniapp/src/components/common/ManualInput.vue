<script setup lang="ts">
// 👉 不报错的 TS 写法
interface Props {
  modelValue: string
}

const props = defineProps<Props>()

// 👉 不报错的 emit 写法
const emit = defineEmits<{
  'update:modelValue': [value: string]
  add: []
}>()

// 双向绑定
const inputValue = ref(props.modelValue)

watch(inputValue, (val) => {
  console.log('111111~~~~~~~~~~~')
  console.log(inputValue)
  emit('update:modelValue', val)
})

watch(
  () => props.modelValue,
  (val) => {
    inputValue.value = val
  },
)
const handleAdd = () => {
  emit('add')
}
</script>

<template>
  <view class="z-99 relative w-full">
    <view class="flex items-center justify-between">
      <!-- 输入框 -->
      <view class="w-full">
        <t-input v-model="inputValue" placeholder="无法扫描时请手动输入">
          <template #extra>
            <t-button theme="primary" size="small" @click="handleAdd"> 添加 </t-button>
          </template>
        </t-input>
      </view>
    </view>
    <view class="h-1rpx flex bg-[#f5f5f5]" />
  </view>
</template>
