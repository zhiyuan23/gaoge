<script setup>
import { useRouter } from 'vue-router'

defineOptions({
  name: 'PageHeaderBar',
})

const props = defineProps({
  backTo: {
    type: [String, Object],
    required: true,
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
</script>

<template>
  <header
    class="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#090a0d]/95 px-4 py-3 backdrop-blur-sm"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between">
      <button
        class="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition-all hover:bg-white/10 hover:text-white"
        @click="handleBack"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>返回</span>
      </button>
      <div class="text-sm font-bold tracking-[2px] text-white">{{ brandLabel }}</div>
      <div class="w-17.5"></div>
    </div>
  </header>
</template>
