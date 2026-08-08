<script setup>
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'PageHeaderBar',
})

const props = defineProps({
  backTo: {
    type: [String, Object],
    default: '',
  },
  actionTo: {
    type: [String, Object],
    default: '',
  },
  actionLabel: {
    type: String,
    default: '',
  },
  actionGlyph: {
    type: String,
    default: '',
  },
  contentClass: {
    type: String,
    default: 'px-4 md:px-16',
  },
  brandLabel: {
    type: String,
    default: 'GAOGE SPORTS',
  },
})

const router = useRouter()

const handleBack = () => {
  void router.push(props.backTo)
}

const handleAction = () => {
  void router.push(props.actionTo)
}
</script>

<template>
  <header
    class="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#090a0d]/95 py-2 backdrop-blur-sm sm:py-3"
  >
    <div class="mx-auto flex w-full max-w-5xl items-center justify-between" :class="contentClass">
      <button
        v-if="backTo"
        class="flex h-8 w-16 cursor-pointer items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white/80 transition-[transform,background-color,border-color,color] duration-200 hover:border-white/15 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-[0.97] sm:h-9 sm:w-20 sm:gap-2 sm:px-3 sm:text-sm"
        @click="handleBack"
      >
        <Icon icon="ph:arrow-left" class="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
        <span>返回</span>
      </button>
      <div v-else class="w-8 sm:w-9" aria-hidden="true"></div>
      <div class="text-[11px] font-bold tracking-[1.5px] text-white sm:text-sm sm:tracking-[2px]">
        {{ brandLabel }}
      </div>
      <button
        v-if="actionTo"
        class="border-white/12 flex h-8 w-8 cursor-pointer items-center justify-center rounded-[10px] border bg-white/[0.07] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-[transform,background-color,border-color,color] duration-200 hover:border-white/25 hover:bg-white/[0.12] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 active:scale-[0.96] sm:h-9 sm:w-9"
        :aria-label="`${actionLabel} 页面`"
        :title="`进入 ${actionLabel} 页面`"
        @click="handleAction"
      >
        <span aria-hidden="true" class="-skew-x-6 text-sm font-black leading-none sm:text-base">
          {{ actionGlyph || actionLabel }}
        </span>
      </button>
      <div v-else class="w-16 sm:w-20" aria-hidden="true"></div>
    </div>
  </header>
</template>
