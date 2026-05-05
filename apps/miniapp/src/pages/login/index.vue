<script setup lang="ts">
import useAuthStore from '@/store/auth'
import { Dialog, Toast } from '@/utils'

const username = ref('')
const password = ref('')
const agree = ref(false)
const showPassword = ref(false)
const userStore = useAuthStore()

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = () => {
  const account = username.value.trim()
  const pwd = password.value.trim()

  if (!account) {
    Toast('请输入用户名')
    return
  }

  if (!pwd) {
    Toast('请输入密码')
    return
  }

  if (!agree.value) {
    Dialog('请先阅读并同意《用户协议》和《隐私政策》')
    return
  }

  void fetchLogin()
}

const fetchLogin = async () => {
  try {
    await userStore.loginByAccount(username.value.trim(), password.value.trim(), true)
  } catch {
    Toast('登录失败，请稍后重试')
  }
}
</script>

<template>
  <view class="page">
    <view class="z-1 pt-180 relative box-border flex min-h-screen flex-col px-48 pb-64">
      <view class="flex-col-center">
        <text class="color-#0F172A font-700 tracking-6rpx text-46 mt-28"> 高歌体育 </text>
      </view>

      <view class="bg-white/92 mt-96 px-36 py-40">
        <view class="mt-40">
          <view
            class="bg-#F8FAFC rounded-24 border-2-solid-#E2E8F0 mt-14 flex h-96 items-center px-28"
          >
            <input
              v-model="username"
              class="color-#0F172A text-28 flex-1"
              placeholder="请输入用户名"
              placeholder-class="text-#94A3B8"
            />
          </view>
        </view>

        <view class="mt-28">
          <view
            class="bg-#F8FAFC rounded-24 border-2-solid-#E2E8F0 mt-14 flex h-96 items-center px-28"
          >
            <input
              v-model="password"
              class="color-#0F172A text-28 flex-1"
              :password="!showPassword"
              placeholder="请输入密码"
              placeholder-class="text-#94A3B8"
            />
            <view class="flex-center-center color-#64748B ml-20 h-full" @click="togglePassword">
              <t-icon :name="showPassword ? 'browse' : 'browse-off'" size="44rpx" />
            </view>
          </view>
        </view>

        <view class="mt-28 flex items-start">
          <PrivacyInfo v-model="agree" />
        </view>

        <view class="mt-40">
          <button
            class="bg-#00A0F0 color-white leading-96 text-30 rounded-24 h-96 w-full"
            @click="handleSubmit"
          >
            登录
          </button>
        </view>
      </view>
    </view>
  </view>
</template>
