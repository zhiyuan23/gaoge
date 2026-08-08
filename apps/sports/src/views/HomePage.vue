<script setup>
import { Keyboard, Mousewheel, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import FullPageSection from '../components/FullPageSection.vue'
import { homepageSections } from '../content/homepage'

import 'swiper/css'

const router = useRouter()
const modules = [Navigation, Keyboard, Mousewheel]
const activeSection = ref(homepageSections[0].id)
const swiperInstance = ref(null)
const isTransitioning = ref(false)
const transitionName = ref('slide-up')

const onSwiper = (swiper) => {
  swiperInstance.value = swiper
}

const onSlideChange = (swiper) => {
  activeSection.value = homepageSections[swiper.activeIndex]?.id ?? homepageSections[0].id
}

// 监听滚动方向，最后一页继续向下滑时才跳转
const onProgress = (swiper) => {
  if (
    swiper.activeIndex === homepageSections.length - 1 &&
    swiper.progress > 0.8 &&
    !isTransitioning.value
  ) {
    isTransitioning.value = true
    transitionName.value = 'slide-up'
    router.replace('/')
  }
}

// 触摸滑动判断，最后一页继续向下滑
const onTouchMove = (swiper) => {
  if (swiper.activeIndex === homepageSections.length - 1 && !isTransitioning.value) {
    // 获取触摸移动距离，判断是否向下滑动
    const diff = swiper.touches.diff
    if (diff < -50) {
      // 向下滑动
      isTransitioning.value = true
      transitionName.value = 'slide-up'
      router.replace('/')
    }
  }
}

const navigateTo = (sectionId, event) => {
  event.preventDefault()
  const index = homepageSections.findIndex((s) => s.id === sectionId)
  if (index !== -1 && swiperInstance.value) {
    swiperInstance.value.slideTo(index, 600)
  }
}

const goToTeams = () => {
  transitionName.value = 'slide-up'
  router.push('/')
}
</script>

<template>
  <div class="page-shell">
    <header class="site-header" data-test="site-header">
      <a class="site-brand" @click.prevent="goToTeams">高歌体育</a>

      <nav class="site-nav" aria-label="Homepage sections">
        <a
          v-for="section in homepageSections"
          :key="section.id"
          :href="`#${section.id}`"
          class="site-nav-link"
          :class="{ 'is-current': activeSection === section.id }"
          :data-test="`nav-link-${section.id}`"
          @click="navigateTo(section.id, $event)"
        >
          {{ section.kicker }}
        </a>
      </nav>
    </header>

    <swiper
      class="fullpage-stack"
      direction="vertical"
      :mousewheel="{ enabled: true, releaseOnEdges: true }"
      :keyboard="{ enabled: true, pageUpDown: true }"
      :speed="600"
      :allow-touch-move="true"
      :modules="modules"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
      @progress="onProgress"
      @touch-move="onTouchMove"
    >
      <swiper-slide v-for="(section, index) in homepageSections" :key="section.id">
        <FullPageSection
          :section="section"
          :index="index"
          :is-active="activeSection === section.id"
        />
      </swiper-slide>
    </swiper>
  </div>
</template>

<style scoped>
.page-shell {
  overflow: hidden;
}
</style>
