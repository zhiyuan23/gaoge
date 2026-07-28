<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

const sectionStyle = computed(() => {
  const style = {
    '--section-image': `url(${props.section.image})`,
    '--mobile-image-offset': `${props.section.mobileImageOffset ?? 0}%`,
  }

  return style
})

const contentPositionClass = computed(() => {
  return props.section.contentPosition
    ? `position-${props.section.contentPosition}`
    : 'position-center'
})

const handleCtaClick = (event) => {
  if (props.section.ctaLink) {
    event.preventDefault()
    router.push(props.section.ctaLink)
  }
}
</script>

<template>
  <section
    :id="section.id"
    class="fullpage-section"
    :class="[
      { 'is-active': isActive },
      section.id === 'finale' ? 'section-finale' : '',
      contentPositionClass,
    ]"
    :style="sectionStyle"
    data-test="fullpage-section"
    :data-section-id="section.id"
  >
    <div class="section-overlay"></div>
    <div class="section-copy">
      <p class="section-kicker">{{ section.kicker }}</p>
      <p class="section-index">{{ String(index + 1).padStart(2, '0') }}</p>
      <h1
        class="section-title"
        :class="{ 'section-title-vertical': section.id === 'finale' }"
        :data-test="section.id === 'finale' ? 'section-title-finale' : undefined"
      >
        {{ section.title }}
      </h1>
      <p class="section-description">{{ section.description }}</p>
      <a
        v-if="section.ctaLabel"
        class="section-cta"
        :href="section.ctaLink || '#'"
        @click="handleCtaClick"
      >
        {{ section.ctaLabel }}
      </a>
    </div>
  </section>
</template>
