<script setup lang="ts">
import { useAgreement } from '@/composables'

const { openUserAgreement, openPrivacyPolicy } = useAgreement()
const agree = defineModel<boolean>({ required: true })

// checkbox-group 需要数组类型
const checkboxValue = ref<string[]>([])

// 同步外部 v-model 的值
watch(
  () => agree.value,
  (val) => {
    checkboxValue.value = val ? ['1'] : []
  },
  { immediate: true },
)

// 处理 checkbox 变化
const handleChange = (payload: { value?: string[] }) => {
  const value = payload?.value ?? []
  checkboxValue.value = value
  agree.value = value.includes('1')
}
</script>

<template>
  <t-checkbox-group :value="checkboxValue" borderless @change="handleChange">
    <t-checkbox
      value="1"
      icon="circle"
      borderless
      :block="false"
      :custom-style="{ background: 'transparent', fontSize: '22rpx' }"
    >
      <view class="flex-center-center text-24">
        <text>已阅读并同意</text>
        <text class="color-#00A0F0" @click.stop="openUserAgreement"> 《用户协议》 </text>
        <text class="color-#00A0F0" @click.stop="openPrivacyPolicy"> 《隐私政策》 </text>
      </view>
    </t-checkbox>
  </t-checkbox-group>
</template>

<style lang="scss" scoped>
:deep(.t-checkbox-group) {
  background: transparent;
}

:deep(.t-checkbox) {
  background: transparent !important;
}

:deep(.t-checkbox__content) {
  background: transparent;
}
</style>
