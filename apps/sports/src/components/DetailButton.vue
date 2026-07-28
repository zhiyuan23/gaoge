<script setup>
import { useRouter } from 'vue-router'

defineOptions({
  name: 'DetailButton',
})

const props = defineProps({
  accentColor: {
    type: String,
    required: true,
  },
  accentTextColor: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '查看明细',
  },
  to: {
    type: [String, Object],
    default: '',
  },
})

const emit = defineEmits(['click'])
const router = useRouter()

const handleClick = () => {
  emit('click')

  if (props.to) {
    void router.push(props.to)
  }
}
</script>

<template>
  <button
    class="border-white/12 bg-white/6 hover:border-white/22 group inline-flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
    @click="handleClick"
  >
    <span class="transition-transform group-hover:-translate-x-0.5">{{ label }}</span>
    <span
      class="flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5"
      :style="{
        backgroundColor: accentColor,
        color: accentTextColor,
      }"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </span>
  </button>
</template>
