<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { size = 40 } = defineProps<{
  size?: number
}>()

const emit = defineEmits<{
  change: [lang: string]
}>()

const { locale, t } = useI18n()

const langOptions = computed(() => [
  { label: t('locale.en'), value: 'en' },
  { label: t('locale.zh-hans'), value: 'zh-Hans' },
])

const langIndex = computed(() => langOptions.value.findIndex((item) => item.value === locale.value))

const handleLangChange = (event: { detail: { value: number } }) => {
  const index = event.detail.value
  const lang = langOptions.value[index]?.value

  if (!lang) {
    return
  }

  locale.value = lang
  // uni-app 原生语言包切换
  uni.setLocale(lang)
  emit('change', lang)
}
</script>

<template>
  <view>
    <picker range-key="label" :range="langOptions" :value="langIndex" @change="handleLangChange">
      <slot>
        <view class="i-mdi-language" :style="{ fontSize: `${size}rpx` }" />
      </slot>
    </picker>
  </view>
</template>
