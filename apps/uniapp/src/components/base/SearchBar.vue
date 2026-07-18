<script setup lang="ts">
const props = defineProps<{
  placeholder?: string
  cityName?: string
  defaultArea?: string[]
}>()

const emit = defineEmits<{
  (e: 'search', value: string): void
  (e: 'clear'): void
  (e: 'regionConfirm', value: any): void
}>()
// 搜索双向绑定
const searchValue = defineModel<string>('modelValue', { default: '' })

const placeholder = computed(() => props.placeholder || '请输入')

// 城市选择相关
const showCityPicker = ref(false)
const selectedArea = ref<string[]>(props.defaultArea || [])

// 监听省市区默认选中值变化
watch(
  () => props.defaultArea,
  (newVal) => {
    if (newVal) {
      selectedArea.value = [...newVal]
    }
  },
  { immediate: true },
)

// 显示的省市文字
const displayCityName = computed(() => {
  if (props.cityName) return props.cityName

  if (selectedArea.value.length >= 2) {
    return selectedArea.value.join(' ')
  }
  return '请选择省市'
})

// 搜索相关
const onInput = () => {
  // emit('search', searchValue.value)
}

const clearSearch = () => {
  searchValue.value = ''
  emit('clear')
}
</script>

<template>
  <view class="flex-center bg-bgSecondary px-30 w-640 rounded-32 border-1-solid-#e6e6e6 h-64">
    <!-- 省市选择 -->
    <view class="flex items-center" @click="showCityPicker = true">
      <text class="text-28 pr-8">
        {{ displayCityName }}
      </text>
      <view class="icon-arrow-down" />
    </view>

    <view class="w-1px bg-#E0E0E0 h-30 ml-20 mr-10" />

    <!-- 右侧：搜索框 -->
    <view class="flex-center relative flex-1">
      <image src="@/static/images/icons/ic-search.png" class="size-42" />

      <input
        v-model="searchValue"
        type="text"
        :focus="false"
        :placeholder="placeholder"
        placeholder-style="color:#C0C4CC; font-size:28rpx;"
        class="leading-64 text-28 ml-10 flex-1"
        @input="onInput"
        @confirm="emit('search', searchValue)"
      />

      <t-icon
        v-if="searchValue"
        name="close-circle-fill"
        size="20"
        color="#999"
        class="absolute right-0"
        @click="clearSearch"
      />
    </view>
  </view>
</template>

<style scoped>
.icon-arrow-down {
  width: 0;
  height: 0;
  border-top: 7rpx solid #909399;
  border-right: 7rpx solid transparent;
  border-left: 7rpx solid transparent;
}
</style>
