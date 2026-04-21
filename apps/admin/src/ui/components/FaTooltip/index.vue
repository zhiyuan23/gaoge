<script setup lang="ts">
import type { TooltipContentProps, TooltipProviderProps } from 'radix-vue'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

defineOptions({
  name: 'FaTooltip',
})

const {
  text = '',
  delay = 300,
  side = 'top',
  align = 'center',
  disabled = false,
} = defineProps<{
  text?: string
  delay?: TooltipProviderProps['delayDuration']
  side?: TooltipContentProps['side']
  align?: TooltipContentProps['align']
  disabled?: boolean
}>()
</script>

<template>
  <TooltipProvider :delay-duration="delay" :disabled="disabled">
    <Tooltip>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipContent :side :align class="z-10000 text-xs">
        <slot name="content">
          <p>{{ text }}</p>
        </slot>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
