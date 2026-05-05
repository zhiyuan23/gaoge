<script setup lang="ts">
import { throttle } from '@/utils'

type StatusType = 'netError' | 'empty' | 'error' | 'noAuth'

interface Props {
  type?: StatusType // 新增 type
  imageUrl?: string
  imgSize?: number
  title?: string
  description?: string
  btnText?: string
  showBtn?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const STATUS_MAP: any = {
  netError: {
    imageUrl: '/static/images/status/page-net-error.png',
    title: '网络异常～',
    description: '请检查网络状态后刷新重试',
    btnText: '立即刷新',
  },
}

const state = computed(() => {
  const defaultConfig = STATUS_MAP[props.type || 'netError']

  return {
    imageUrl: props.imageUrl ?? defaultConfig.imageUrl,
    imgSize: props.imgSize ?? 360,
    title: props.title ?? defaultConfig.title,
    description: props.description ?? defaultConfig.description,
    btnText: props.btnText ?? defaultConfig.btnText,
  }
})

const onBtnClick = throttle(() => {
  emit('click')
}, 2000)
</script>

<template>
  <div class="page flex-col-center-center bg-bgSecondary text-center">
    <image
      :src="state.imageUrl"
      mode="aspectFit"
      :style="{ width: `${state.imgSize}rpx`, height: `${state.imgSize}rpx` }"
      class="mb-40rpx -mt-200"
    />

    <text class="mb-34rpx text-32rpx text-#333 font-bold">
      {{ state.title }}
    </text>

    <text class="mb-80rpx px-40rpx text-28rpx text-#999">
      {{ state.description }}
    </text>

    <slot name="action">
      <view
        v-if="state.btnText"
        class="t-press h-80rpx w-240rpx flex-center-center rounded-40rpx text-#353535 text-32 border-2-solid-#B2B2B2 bg-white"
        @tap="onBtnClick"
      >
        {{ state.btnText }}
      </view>
    </slot>
  </div>
</template>
