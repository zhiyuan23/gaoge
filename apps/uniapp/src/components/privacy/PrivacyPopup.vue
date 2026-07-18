<script setup lang="ts">
import { useAgreement } from '@/composables'

const emit = defineEmits<{
  agree: []
  disagree: []
  authorized: []
}>()

const { openUserAgreement, openPrivacyPolicy } = useAgreement()

const show = defineModel<boolean>({ required: true })

const btnStyle = ref({
  fontSize: '32rpx',
  borderRadius: '10rpx',
})

// 同意并关闭
const handleAgree = () => {
  handleClose()
  emit('agree')
}

// 拒绝并关闭
const handleDisagree = () => {
  handleClose()
  emit('disagree')
}

// 关闭弹窗
const handleClose = () => {
  show.value = false
}
</script>

<template>
  <t-popup :show="show" round="20" :safe-area-inset-bottom="false" @close="handleClose">
    <view class="px-45 text-30">
      <view class="pt-50 leading-30"> 服务协议及隐私保护 </view>
      <view class="px-18 pt-90 text-center">
        为了更好地保障您的合法权益，请您阅读并同意 以下协议
        <text class="color-primary" @click.stop="openUserAgreement"> 《用户协议》 </text>
        <text class="color-primary" @click.stop="openPrivacyPolicy"> 《隐私政策》 </text>
        ，未注册手 机号将自动注册
      </view>

      <view class="flex-center-center pt-120 gap-30 pb-20">
        <view class="w-300">
          <t-button type="default" shape="square" :custom-style="btnStyle" @click="handleDisagree">
            以后再说
          </t-button>
        </view>
        <view class="w-300">
          <t-button
            type="primary"
            shape="square"
            color="var(--wechat-primary)"
            :custom-style="btnStyle"
            @click="handleAgree"
          >
            允许
          </t-button>
        </view>
      </view>
    </view>
    <view class="h-50 w-full" />
  </t-popup>
</template>
