<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

import useUserStore from '@/store/user'
import { FormControl, FormField, FormItem, FormMessage } from '@/ui/shadcn/ui/form'

defineOptions({
  name: 'LoginForm',
})

const props = defineProps<{
  account?: string
}>()

const emits = defineEmits<{
  onLogin: [account?: string]
  onRegister: [account?: string]
  onResetPassword: [account?: string]
}>()

const userStore = useUserStore()

const title = import.meta.env.VITE_APP_TITLE
const loading = ref(false)

// 登录方式，default 账号密码登录，qrcode 扫码登录
const type = ref<'default' | 'qrcode'>('default')

const form = useForm({
  validationSchema: toTypedSchema(
    z.object({
      account: z.string().min(1, '请输入用户名'),
      password: z.string().min(1, '请输入密码'),
      remember: z.boolean(),
    }),
  ),
  initialValues: {
    account: props.account ?? localStorage.getItem('login_account') ?? '',
    password: '',
    remember: !!localStorage.getItem('login_account'),
  },
})
const onSubmit = form.handleSubmit((values) => {
  loading.value = true
  userStore
    .login({
      account: values.account,
      password: values.password,
    })
    .then(() => {
      if (values.remember) {
        localStorage.setItem('login_account', values.account)
      } else {
        localStorage.removeItem('login_account')
      }
      emits('onLogin', values.account)
    })
    .finally(() => {
      loading.value = false
    })
})
</script>

<template>
  <div class="min-h-500px flex-col-stretch-center w-full p-12">
    <div class="mb-6 space-y-2">
      <h3 class="color-[var(--el-text-color-primary)] text-4xl font-bold">欢迎使用 👋🏻</h3>
      <p class="text-muted-foreground text-sm lg:text-base">
        {{ title }}
      </p>
    </div>
    <!-- <div class="mb-4">
      <FaTabs
        v-model="type"
        :list="[
          { label: '账号密码登录', value: 'default' },
          { label: '扫码登录', value: 'qrcode' },
        ]"
        class="inline-flex"
      />
    </div> -->
    <div v-show="type === 'default'">
      <form @submit="onSubmit">
        <FormField v-slot="{ componentField, errors }" name="account">
          <FormItem class="relative space-y-0 pb-6">
            <FormControl>
              <FaInput
                type="text"
                placeholder="请输入用户名"
                class="w-full"
                :class="errors.length ? 'border-destructive' : undefined"
                v-bind="componentField"
              />
            </FormControl>
            <Transition
              enter-active-class="transition-opacity"
              enter-from-class="opacity-0"
              leave-active-class="transition-opacity"
              leave-to-class="opacity-0"
            >
              <FormMessage class="absolute bottom-1 text-xs" />
            </Transition>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField, errors }" name="password">
          <FormItem class="relative space-y-0 pb-6">
            <FormControl>
              <FaInput
                type="password"
                placeholder="请输入密码"
                class="w-full"
                :class="errors.length ? 'border-destructive' : undefined"
                v-bind="componentField"
              />
            </FormControl>
            <Transition
              enter-active-class="transition-opacity"
              enter-from-class="opacity-0"
              leave-active-class="transition-opacity"
              leave-to-class="opacity-0"
            >
              <FormMessage class="absolute bottom-1 text-xs" />
            </Transition>
          </FormItem>
        </FormField>
        <div class="flex-center-between mb-4">
          <div class="flex-center-start">
            <FormField v-slot="{ componentField }" type="checkbox" name="remember">
              <FormItem>
                <FormControl>
                  <FaCheckbox v-bind="componentField"> 记住我 </FaCheckbox>
                </FormControl>
              </FormItem>
            </FormField>
          </div>
          <!-- <FaButton
            variant="link"
            class="h-auto p-0"
            type="button"
            @click="emits('onResetPassword', form.values.account)"
          >
            忘记密码了?
          </FaButton> -->
        </div>
        <FaButton :loading="loading" size="lg" class="w-full" type="submit"> 登录 </FaButton>
        <!-- <div class="flex-center mt-4 gap-2 text-sm">
          <span class="text-secondary-foreground op-50">还没有帐号?</span>
          <FaButton
            variant="link"
            class="h-auto p-0"
            type="button"
            @click="emits('onRegister', form.values.account)"
          >
            注册新帐号
          </FaButton>
        </div> -->
      </form>
    </div>
    <div v-show="type === 'qrcode'">
      <div class="flex-col-center">
        <img src="https://s2.loli.net/2024/04/26/GsahtuIZ9XOg5jr.png" class="h-250px w-250px" />
        <div class="text-secondary-foreground op-50 mt-2 text-sm">请使用微信扫码登录</div>
      </div>
    </div>
  </div>
</template>
